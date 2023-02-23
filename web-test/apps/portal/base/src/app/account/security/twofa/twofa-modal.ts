import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TfaInfo } from '@b3networks/api/auth';
import { TwoFaActionType } from '../security.model';
import { TwofaSaveRecoveryCodeSettingsComponent } from './enable/saverecoverycode';
import { TwofaVerifyEmailSettingsComponent } from './otpFlow/verifyemail';

@Component({
  selector: 'b3n-twofa-modal',
  templateUrl: './twofa-modal.html',
  styleUrls: ['twofa.scss']
})
export class TwofaModalComponent {
  @ViewChild(TwofaVerifyEmailSettingsComponent)
  tfaVerifyEmailSettingsComponent: TwofaVerifyEmailSettingsComponent;
  @ViewChild(TwofaSaveRecoveryCodeSettingsComponent)
  tfaSaveRecoveryCodeSettingsComponent: TwofaSaveRecoveryCodeSettingsComponent;

  email: string;
  tfaInfo: TfaInfo;
  mobileNumber: string;

  step = 1;
  action: TwoFaActionType;
  showHeader = true;

  readonly TwoFaActionType = TwoFaActionType;

  constructor(private dialogRef: MatDialogRef<TwofaModalComponent>, @Inject(MAT_DIALOG_DATA) data: any) {
    console.log(data);

    this.email = data.email;
    this.tfaInfo = data.tfaInfo;
    this.mobileNumber = data.mobileNumber;
    this.action = data.action;
    this.gotoStep(1);
  }

  gotoStep(step: number) {
    this.step = step;
    if (step == 1) {
      setTimeout(() => {
        this.tfaVerifyEmailSettingsComponent.initData();
      }, 0);
    } else if (step == 2) {
      setTimeout(() => {
        this.tfaSaveRecoveryCodeSettingsComponent.initData();
      }, 0);
    }
  }

  finishStep(action: string) {
    if (action == 'continue') {
      this.gotoStep(2);
    } else {
      this.close();
    }
  }

  close() {
    this.dialogRef.close({ success: true });
  }

  doActionStep2(action: string) {
    if (action == 'cancel') {
      this.close();
    } else if (action == 'hideHeader') {
      this.showHeader = false;
    } else if (action == 'showHeader') {
      this.showHeader = true;
    }
  }
}
