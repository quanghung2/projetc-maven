import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RealDomainService, UpdatePersonalRequestBuilder } from '@b3networks/api/auth';
import { SessionService } from '@b3networks/portal/base/shared';
import { encrypt } from '@b3networks/shared/common';
import { ModalService } from '../../../shared/modal/modal.service';

export class UpdatePersonalError {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  serverError: string;

  hasError() {
    return this.oldPassword || this.newPassword || this.confirmPassword || this.serverError;
  }
}

@Component({
  selector: 'b3n-account-password-modal-settings',
  template: `
    <h1 mat-dialog-title>Change Password</h1>
    <div mat-dialog-content>
      <div class="row">
        <mat-form-field>
          <input
            #oldPasswordInput
            readonly
            matInput
            type="password"
            placeholder="Old Password"
            [(ngModel)]="oldPassword"
            (keyup.enter)="updatePersonal()"
            (keypress)="resetError()"
            (focus)="removeReadonlyAttr(oldPasswordInput)"
          />
          <mat-hint class="error-hint" *ngIf="error.oldPassword">{{ error.oldPassword }}</mat-hint>
        </mat-form-field>
        <mat-form-field>
          <input
            #newPasswordInput
            readonly
            matInput
            type="password"
            placeholder="New Password"
            [(ngModel)]="newPassword"
            (keyup.enter)="updatePersonal()"
            (keypress)="resetError()"
            (focus)="removeReadonlyAttr(newPasswordInput)"
          />
          <mat-hint class="error-hint" *ngIf="error.newPassword">{{ error.newPassword }}</mat-hint>
        </mat-form-field>
        <mat-form-field>
          <input
            #confirmPasswordInput
            readonly
            matInput
            type="password"
            placeholder="Confirm New Password"
            [(ngModel)]="confirmNewPassword"
            (keyup.enter)="updatePersonal()"
            (keypress)="resetError()"
            (focus)="removeReadonlyAttr(confirmPasswordInput)"
          />
          <mat-hint class="error-hint" *ngIf="error.confirmPassword">{{ error.confirmPassword }}</mat-hint>
        </mat-form-field>
      </div>
      <div class="ui error message" *ngIf="error.serverError">{{ error.serverError }}</div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button [loading]="progressing" (click)="updatePersonal()" color="primary">Update</button>
    </div>
  `,
  styleUrls: ['./modal.scss']
})
export class PasswordModalSettingsComponent {
  @ViewChild('oldPasswordInput') oldPasswordInput: ElementRef;
  @ViewChild('newPasswordInput') newPasswordInput: ElementRef;
  @ViewChild('confirmPasswordInput') confirmPasswordInput: ElementRef;

  oldPassword = '';
  newPassword = '';
  confirmNewPassword = '';

  error = new UpdatePersonalError();
  progressing: boolean;

  constructor(
    private router: Router,
    private realDomainService: RealDomainService,
    private sessionService: SessionService,
    private modalService: ModalService,
    private dialogRef: MatDialogRef<PasswordModalSettingsComponent>
  ) {}

  resetError() {
    this.error = new UpdatePersonalError();
  }

  updatePersonal() {
    if (this.validate()) {
      this.progressing = true;
      const updatePersonalRequest = new UpdatePersonalRequestBuilder().createUpdatePersonalRequestForPassword(
        this.oldPassword,
        this.newPassword
      );
      this.realDomainService.getRealDomainFromPortalDomain().subscribe(async realDomain => {
        if (realDomain.publicKey) {
          updatePersonalRequest.password = await encrypt(updatePersonalRequest.password, realDomain.publicKey);
          updatePersonalRequest.newPassword = await encrypt(updatePersonalRequest.newPassword, realDomain.publicKey);
        }
        this.sessionService.updatePersonalInfo(updatePersonalRequest).subscribe(
          _ => {
            this.dialogRef.close({ success: true });
            this.modalService.openSuccessModal(
              'Your password has been successfully updated. Please login with your new password'
            );
            setTimeout(() => {
              this.relogin();
            }, 3000);
          },
          error => {
            this.progressing = false;
            this.clearInput();
            const data = error.error;
            if (data.code === 'auth.AccessDenied') {
              this.error.oldPassword = 'Wrong old password';
            } else {
              this.error.serverError = data.message;
            }
          }
        );
      });
    }
  }

  removeReadonlyAttr(input: HTMLInputElement) {
    input.removeAttribute('readonly');
  }

  private validate() {
    this.error = new UpdatePersonalError();
    if (!this.oldPassword) {
      this.error.oldPassword = 'Please enter your old password';
    }
    if (!this.newPassword) {
      this.error.newPassword = 'Please enter your new password';
    } else if (this.newPassword !== this.confirmNewPassword) {
      this.error.confirmPassword = 'Your new password and confirm password do not match';
    }

    return !this.error.hasError();
  }

  private relogin() {
    this.sessionService.logout();
    this.router.navigate(['auth']);
  }

  private clearInput() {
    this.oldPasswordInput.nativeElement.value = '';
    this.newPasswordInput.nativeElement.value = '';
    this.confirmPasswordInput.nativeElement.value = '';
  }
}
