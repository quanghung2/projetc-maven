import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CallflowConfig, OrgConfigQuery, QueueConfig, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { FlowService } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-edit-queue',
  templateUrl: './edit-queue.component.html',
  styleUrls: ['./edit-queue.component.scss']
})
export class EditQueueComponent extends DestroySubscriberComponent implements OnInit {
  queue = new QueueConfig();
  saving = false;
  listFlowName = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private flowService: FlowService,
    private queueService: QueueService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce,
    private orgConfigQuery: OrgConfigQuery,
    public dialogRef: MatDialogRef<EditQueueComponent>
  ) {
    super();
  }

  ngOnInit() {
    this.spinnerService.showSpinner();
    this.queueService
      .getQueueConfig(this.data.uuid)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        queue => {
          this.queue = queue;
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  save() {
    this.saving = true;
    const config = {
      priority: this.queue.priority,
      label: this.queue.label,
      code: this.queue.code
    } as QueueConfig;
    if (this.queue.callflowConfig?.genieCode) {
      config.callflowConfig = {} as CallflowConfig;
      config.callflowConfig.genieCode = this.queue.callflowConfig.genieCode;
    }

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        updatedQueue => {
          this.dialogRef.close(updatedQueue);
          this.toastService.success('Queue infomation has been updated. This update will take effect after 5 minutes.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
