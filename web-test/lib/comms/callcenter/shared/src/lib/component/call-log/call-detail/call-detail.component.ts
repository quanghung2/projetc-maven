import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrganizationService } from '@b3networks/api/auth';
import { CallLogTxn, QueueService, TakeNoteReq, TxnService } from '@b3networks/api/callcenter';
import { USER_INFO, X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-call-detail',
  templateUrl: './call-detail.component.html',
  styleUrls: ['./call-detail.component.scss']
})
export class CallDetailComponent implements OnInit {
  call: CallLogTxn;
  userUtcOffset: string;
  timeFormat: string;
  orderInfoArr: KeyValue<string, string>[];
  isUpdating: boolean;
  codes: string[];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: CallLogTxn,
    private orgService: OrganizationService,
    private txnService: TxnService,
    private spinnerServier: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<CallDetailComponent>,
    private toastService: ToastService,
    private queueService: QueueService
  ) {
    this.call = Object.assign({}, data);
  }

  ngOnInit() {
    this.spinnerServier.showSpinner();
    this.orderInfoArr = [];
    if (this.call.displayData) {
      for (let item of Object.keys(this.call.displayData)) {
        this.orderInfoArr.push(<KeyValue<string, string>>{
          key: item,
          value: this.call.displayData[item]
        });
      }
    }

    forkJoin([
      this.orgService.getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid]),
      this.queueService.getQueueConfig(this.call.queueUuid)
    ])
      .pipe(
        finalize(() => {
          this.spinnerServier.hideSpinner();
        })
      )
      .subscribe(([org, queueConfig]) => {
        this.userUtcOffset = org.utcOffset;
        this.timeFormat = org.timeFormat;
        this.codes = queueConfig.agentWorkflowConfig.codeOptions;
      });
  }

  onUpdateNote() {
    const req = <TakeNoteReq>{
      session: this.call.txnUuid,
      code: this.call.code ? this.call.code : '',
      note: this.call.note
    };

    this.spinnerServier.showSpinner();
    this.isUpdating = true;
    this.txnService
      .takeNote(req)
      .pipe(
        finalize(() => {
          this.isUpdating = false;
          this.spinnerServier.hideSpinner();
        })
      )
      .subscribe(
        result => {
          if (result.status === 'success') {
            this.toastService.success('Update successfully. Your update will be affected after a few seconds.');
          }
          this.dialogRef.close();
        },
        err => {
          this.toastService.error(err.message);
          this.dialogRef.close();
        }
      );
  }
}
