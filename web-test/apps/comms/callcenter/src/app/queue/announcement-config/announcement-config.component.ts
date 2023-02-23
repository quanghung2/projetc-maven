import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CallflowConfig, QueueConfig, QueueInfo, QueueService, TtsConfig } from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, map } from 'rxjs/operators';

@Component({
  selector: 'b3n-announcement-config',
  templateUrl: './announcement-config.component.html',
  styleUrls: ['./announcement-config.component.scss']
})
export class AnnouncementConfigComponent implements OnInit {
  loading = false;
  queue: QueueConfig;
  gatherMsg: TtsConfig;
  hangupMsgOnMaxGatherTimes: TtsConfig;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<AnnouncementConfigComponent>
  ) {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.spinnerService.showSpinner();
    this.queueService
      .getQueueConfig(this.data.uuid)
      .pipe(
        map(res => {
          const obj = Object.assign(new QueueConfig(), res);
          obj.callflowConfig = Object.assign(new CallflowConfig(), res.callflowConfig);
          return obj;
        }),
        finalize(() => this.spinnerService.hideSpinner())
      )
      .subscribe(
        queue => {
          this.loading = false;
          this.queue = queue;
          this.gatherMsg = this.queue.callflowConfig.gatherMsgConfig;
          this.hangupMsgOnMaxGatherTimes = this.queue.callflowConfig.hangupMsgOnMaxGatherTimesConfig;
        },
        err => {
          this.loading = false;
          this.toastService.error(err.message);
        }
      );
  }

  ngOnInit() {}

  save() {
    this.queue.callflowConfig.gatherMsg = this.gatherMsg.xml();
    if (this.queue.callflowConfig.maxGatherTimes <= 0) {
      this.queue.callflowConfig.maxGatherTimes = -1;
      this.queue.callflowConfig.hangupMsgOnMaxGatherTimes = '';
    } else {
      this.queue.callflowConfig.hangupMsgOnMaxGatherTimes = this.hangupMsgOnMaxGatherTimes.xml();
    }
    this.spinnerService.showSpinner();
    const config = {
      callflowConfig: {
        gatherMsg: this.queue.callflowConfig.gatherMsg,
        hangupMsgOnMaxGatherTimes: this.queue.callflowConfig.hangupMsgOnMaxGatherTimes,
        maxGatherTimes: this.queue.callflowConfig.maxGatherTimes,
        waitTime: this.queue.callflowConfig.waitTime,
        gatherTimeout: this.queue.callflowConfig.gatherTimeout
      } as CallflowConfig
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        queue => {
          this.queue = queue;
          this.dialogRef.close('saved');
          this.toastService.success('Messages have been updated. This update will take effect after 5 minutes.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
