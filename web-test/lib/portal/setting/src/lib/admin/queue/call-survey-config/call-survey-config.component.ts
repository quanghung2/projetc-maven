import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QueueConfig, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { delay, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-call-survey-config',
  templateUrl: './call-survey-config.component.html',
  styleUrls: ['./call-survey-config.component.scss']
})
export class CallSurveyComponent implements OnInit {
  loading: boolean;
  queueConfig: QueueConfig;
  senderNumbers: string[] = [];
  updating = false;
  isValid: boolean;

  @ViewChild('smsContent') smsContent: ElementRef;

  isEnablePostCallSurvey = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public queue: QueueInfo,
    public dialogRef: MatDialogRef<QueueConfig>,
    private callerIdService: CallerIdService,
    private queueService: QueueService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loading = true;

    forkJoin([this.callerIdService.findSenders(X.orgUuid), this.queueService.getQueueConfig(this.queue.uuid)])
      .pipe(
        delay(400),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(data => {
        this.senderNumbers = [];
        this.senderNumbers = [].concat(...data[0].map(d => d.sender)).sort((a, b) => a.localeCompare(b));

        this.queueConfig = data[1];

        if (this.queueConfig.postCallConfig.senderNumber) {
          this.isEnablePostCallSurvey = true;
        } else {
          this.queueConfig.postCallConfig.senderNumber = '';
          this.queueConfig.postCallConfig.message = '';
          this.isEnablePostCallSurvey = false;
        }
      });
  }

  changeEnablePostCallSurveyStt(event) {
    this.isEnablePostCallSurvey = event.checked;
    if (this.isEnablePostCallSurvey) {
      this.queueConfig.postCallConfig.message = this.queueConfig.postCallConfig.message
        ? this.queueConfig.postCallConfig.message
        : '';
    }
  }

  onUpdateValue($event: string) {
    this.queueConfig.postCallConfig.message = $event;
  }

  validForm($event) {
    this.isValid = $event;
  }

  update() {
    if (!this.isEnablePostCallSurvey) {
      this.queueConfig.postCallConfig.senderNumber = '';
      this.queueConfig.postCallConfig.message = '';
    }
    this.updating = true;
    const config = {
      postCallConfig: this.queueConfig.postCallConfig
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.queue.uuid, config)
      .pipe(
        finalize(() => {
          this.updating = false;
        })
      )
      .subscribe(
        queue => {
          this.toastService.success(
            'Post-call survey configuration has updated. This update will take effect after 5 minutes.'
          );
          this.dialogRef.close();
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
