import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UpdatePersonalRequestBuilder } from '@b3networks/api/auth';
import { SessionService } from '@b3networks/portal/base/shared';
import { MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ModalService } from '../../../shared/modal/modal.service';

export interface ChangeEmailInput {
  email: string;
  unverifiedEmail: string;
  unverifiedEmailToken: string;
}
@Component({
  selector: 'b3n-account-email-modal-settings',
  template: `
    <h1 mat-dialog-title>Change Email</h1>
    <div mat-dialog-content>
      <form #form="ngForm" class="row">
        <mat-form-field>
          <input
            matInput
            type="email"
            placeholder="Email"
            [(ngModel)]="emailInput"
            (keyup.enter)="updateEmail()"
            required
            email
            name="emailIpt"
          />
          <mat-error>Invalid email address</mat-error>
        </mat-form-field>
      </form>
      <div class="ui small message" *ngIf="unverifiedEmail && email && !error">
        <p>
          Your new email address <strong>{{ unverifiedEmail }}</strong> hasn’t been verified yet, we will keep sending
          notifications to current email <strong>{{ email }}</strong>
        </p>
      </div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        [loading]="progressing"
        [disabled]="form.invalid"
        color="primary"
        (click)="updateEmail()"
      >
        Update
      </button>
    </div>
  `,
  styleUrls: ['modal.scss']
})
export class EmailModalSettingsComponent {
  email: string;
  unverifiedEmail: string;
  unverifiedEmailToken: string;

  emailInput = '';
  error = '';
  progressing: boolean;

  constructor(
    private dialogRef: MatDialogRef<EmailModalSettingsComponent>,
    private sessionService: SessionService,
    private modalService: ModalService,
    @Inject(MAT_DIALOG_DATA) data: ChangeEmailInput,
    private toastr: ToastService
  ) {
    this.email = data.email;
    this.unverifiedEmail = data.unverifiedEmail;
    this.unverifiedEmailToken = data.unverifiedEmailToken;
  }

  updateEmail() {
    if (this.validateEmail()) {
      this.progressing = true;
      const updatePersonalRequest = new UpdatePersonalRequestBuilder().createUpdatePersonalRequestForEmail(
        this.emailInput
      );
      this.sessionService.updatePersonalInfo(updatePersonalRequest).subscribe(
        _ => {
          this.progressing = false;
          this.dialogRef.close({ success: true });
          this.modalService.openSuccessModal(
            `An email with instructions to complete the verification has been sent to ${this.emailInput}.`
          );
        },
        error => {
          this.progressing = false;
          const err = error.error;
          if (err.code === 'auth.emailAlreadyRegistered') {
            this.error = 'Email already registered in the system. Please use a different one.';
          } else {
            this.error = MessageConstants.GENERAL_ERROR;
          }
          this.toastr.warning(this.error);
        }
      );
    }
  }

  private validateEmail() {
    this.error = '';
    if (this.emailInput) {
      const reg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      if (!reg.test(this.emailInput.trim())) {
        this.error = 'Your email is invalid';
      }
    } else {
      this.error = 'Please enter your email';
    }
    return !this.error;
  }
}
