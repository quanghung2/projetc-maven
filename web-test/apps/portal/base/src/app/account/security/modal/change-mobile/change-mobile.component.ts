import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PhoneNumberService, SendCodeResponse, UpdatePersonalRequest } from '@b3networks/api/auth';
import { SessionService } from '@b3networks/portal/base/shared';
import { MessageConstants } from '@b3networks/shared/common';
import { ModalService } from '../../../../shared/modal/modal.service';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

class UpdatePersonalError {
  mobileNum: string;
  verifyCode: string;

  hasError() {
    return this.mobileNum || this.verifyCode;
  }
}

@Component({
  selector: 'app-change-mobile-dialog',
  templateUrl: './change-mobile.html',
  styleUrls: ['./change-mobile.scss']
})
export class ChangeMobileDialog {
  inputMobileNumber: string;
  token: string;
  ctaButtonText: 'Create' | 'Update' = 'Create';
  progressing: boolean;

  constructor(
    private router: Router,
    public dialogRef: MatDialogRef<ChangeMobileDialog>,
    private phoneNumberService: PhoneNumberService,
    private modalService: ModalService,
    private sessionService: SessionService,
    @Inject(MAT_DIALOG_DATA) public mobileNumber: number,
    private toastService: ToastService
  ) {
    if (this.mobileNumber) {
      this.ctaButtonText = 'Update';
    }
  }

  updatePersonal() {
    this.progressing = true;
    const req = {
      number: this.inputMobileNumber
    } as UpdatePersonalRequest;

    this.sessionService
      .updatePersonalInfo(req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ success: true });
          this.modalService.openSuccessModal(
            'Your mobile number has been successfully changed. Please login with your new mobile number.'
          );
          setTimeout(() => {
            this.relogin();
          }, 3000);
        },
        error => {
          this.toastService.error(error?.error?.message || MessageConstants.GENERAL_ERROR);
        }
      );
  }

  private relogin() {
    this.sessionService.logout();
    this.router.navigate(['auth']);
  }
}
