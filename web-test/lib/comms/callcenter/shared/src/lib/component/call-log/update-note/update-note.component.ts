import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CallLogTxn,
  DetailCustomField,
  QueueConfig,
  QueueService,
  TakeNoteReq,
  TxnService
} from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { CallDetailComponent } from '../call-detail/call-detail.component';

@Component({
  selector: 'b3n-update-note',
  templateUrl: './update-note.component.html',
  styleUrls: ['./update-note.component.scss']
})
export class UpdateNoteComponent implements OnInit {
  call: CallLogTxn;
  queueConfig: QueueConfig;
  req: TakeNoteReq;
  progressing: boolean;

  get hasCustomField() {
    return this.queueConfig?.customFields?.length > 0;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) call: CallLogTxn,
    private txnService: TxnService,
    private spinnerServier: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<CallDetailComponent>,
    private toastService: ToastService,
    private queueService: QueueService
  ) {
    this.call = call;
  }

  ngOnInit() {
    this.spinnerServier.showSpinner();

    this.req = <TakeNoteReq>{
      session: this.call.txnUuid,
      code: this.call.code || '',
      note: this.call.note
    };

    this.queueService
      .getQueueConfig(this.call.queueUuid)
      .pipe(
        finalize(() => {
          this.spinnerServier.hideSpinner();
        })
      )
      .subscribe(queueConfig => {
        this.queueConfig = queueConfig;
        this.mapAnswerToQuestions(this.queueConfig.customFields, this.call.tag);
      });
  }

  progress() {
    this.progressing = true;

    const tag = {};
    this.queueConfig.customFields.forEach(field => {
      const prop = field.key;
      tag[prop] = field.value;
    });
    this.req.tag = tag;

    this.txnService
      .takeNote(this.req)
      .pipe(
        finalize(() => {
          this.progressing = false;
        })
      )
      .subscribe(
        result => {
          if (result.status === 'success') {
            this.toastService.success('Update successfully. Your update will be affected after a few seconds.');
          }
          this.dialogRef.close(true);
        },
        err => {
          this.toastService.error(err.message);
          this.dialogRef.close();
        }
      );
  }

  private mapAnswerToQuestions(questions: DetailCustomField[], answers: { [key: string]: string | string[] }) {
    questions.forEach(item => {
      if (!!answers[item.key]) {
        item.value = answers[item.key];
      }
    });
  }
}
