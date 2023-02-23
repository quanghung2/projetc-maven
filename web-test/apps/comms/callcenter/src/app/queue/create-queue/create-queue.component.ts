import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateRequest, OrgConfigQuery, OrgConfigService, QueueConfig, QueueService } from '@b3networks/api/callcenter';
import { FlowService } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-queue',
  templateUrl: './create-queue.component.html',
  styleUrls: ['./create-queue.component.scss']
})
export class CreateQueueComponent extends DestroySubscriberComponent implements OnInit {
  queueType = 'manual';
  constructor(
    @Inject(MAT_DIALOG_DATA) public queue: DialogCreateQueue,
    private queueService: QueueService,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private flowService: FlowService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<CreateQueueComponent>,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {}

  create() {
    if (!this.queue.data.label || this.queue.data.label === '') {
      return;
    }
    this.queue.data.genieCode = this.queueType == 'flow' ? this.queue.data.genieCode : null;

    this.spinnerService.showSpinner();
    this.queueService
      .createQueue(this.queue.data)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        res => {
          this.dialogRef.close(Object.assign(new QueueConfig(), res));
          this.toastService.success('Create successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}

export class DialogCreateQueue {
  isDuplicate: boolean;
  data: CreateRequest;
  constructor(isDuplicate: boolean, data: CreateRequest) {
    this.isDuplicate = isDuplicate;
    this.data = data;
  }
}
