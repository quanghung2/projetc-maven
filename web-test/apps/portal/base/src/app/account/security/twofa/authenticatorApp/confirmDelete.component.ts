import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TfaService } from '@b3networks/api/auth';
import { ModalService } from '../../../../shared/modal/modal.service';

@Component({
  selector: 'confirmAuthenticatorApp-modal',
  template: `
    <h1 mat-dialog-title>Delete Authenticator</h1>
    <div mat-dialog-content>
      <p>
        Removing this option will make verification codes on email your default second step. Are you sure you want to
        proceed?
      </p>
      <div class="message error" *ngIf="error">
        <p>{{ error }}</p>
      </div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button [loading]="progressing" (click)="deleteTotp()" color="primary">Yes</button>
    </div>
  `
})
export class DeleteAuthenticatorAppModal implements OnInit {
  error = '';
  progressing: boolean;

  constructor(
    private tfaService: TfaService,
    private modalService: ModalService,
    private dialogRef: MatDialogRef<DeleteAuthenticatorAppModal>
  ) {}

  ngOnInit() {}

  resetError() {
    this.error = '';
  }

  deleteTotp() {
    this.resetError();
    this.progressing = true;
    this.tfaService.deleteTotp().subscribe(
      _ => {
        this.progressing = false;
        this.tfaService.get2FaInfo().subscribe();
        this.modalService.openSuccessModal('You have deleted Authenticator successfully.');
        this.dialogRef.close({ success: true });
      },
      error => {
        this.progressing = false;
        this.error = 'The application has encountered an unknown error.';
      }
    );
  }
}
