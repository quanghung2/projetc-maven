import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StaffExtensionQuery } from '@b3networks/api/bizphone';
import { RecipientInfo, RespRecipientPhone, SmsJobService } from '@b3networks/api/sms';
import { TextTestUtils } from '@b3networks/comms/callcenter/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { SmsLengthCalculator } from '@b3networks/shared/ui/textarea-sms';
import { ToastService } from '@b3networks/shared/ui/toast';
import { guid } from '@datorama/akita';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-sms',
  templateUrl: './create-sms.component.html',
  styleUrls: ['./create-sms.component.scss']
})
export class CreateSmsComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  callerId: string;
  number: string;
  sms = '';
  smsControl: UntypedFormControl = this.fb.control('');
  smsCounter = new SmsLengthCalculator({
    smsParts: 1,
    charsInOneSms: 136
  });

  constructor(
    private dialogRef: MatDialogRef<CreateSmsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    private staffExtensionQuery: StaffExtensionQuery,
    private smsService: SmsJobService,
    private toastService: ToastService
  ) {
    super();
    this.smsControl.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      this.sms = value;
      this.calculateCouter(value);
    });
  }

  ngOnInit() {
    const ext = this.staffExtensionQuery.getByIdentity(this.data.identityUuid);
    if (ext) {
      this.callerId = ext.callerId;
    }

    if (this.data?.number) {
      this.number = this.data.number;
    }

    this.smsControl.setValue(this.sms);
    if (this.sms && this.sms !== '') {
      this.calculateCouter(this.sms);
    }
  }

  calculateCouter(value: string) {
    const ischeckIsContainsNonLatinCodepoints = TextTestUtils.checkIsContainsNonLatinCodepoints(value);
    if (ischeckIsContainsNonLatinCodepoints) {
      this.smsCounter.charsInOneSms = value.length <= 46 ? 46 : 43;
    } else {
      this.smsCounter.charsInOneSms = value.length <= 136 ? 136 : 129;
    }
    this.smsCounter.smsParts = Math.floor(value.length / this.smsCounter.charsInOneSms) + 1;
  }

  send() {
    const body = new RecipientInfo({
      refId: guid(),
      recipients: [
        {
          dest: this.number
        }
      ],
      senderName: this.callerId,
      msg: this.sms
    });
    this.smsService.sendSMS(body).subscribe(
      (recipient: RespRecipientPhone) => {
        if (recipient) {
          this.toastService.success('Message already scheduled to send out.');
          this.dialogRef.close(true);
        }
      },
      err => {
        // retry
        if (err instanceof HttpErrorResponse) {
          if (err?.error?.message.indexOf('sms.refIdAlreadyExisted') >= 0) {
            this.send();
          } else {
            this.toastService.error(err.error.message);
          }
        }
      }
    );
  }
}
