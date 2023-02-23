import { Component, Inject, OnInit } from '@angular/core';
import { EmailIntegrationService, EmailSignature, MeQuery } from '@b3networks/api/workspace';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { MessageConstants } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-signature-detail',
  templateUrl: './signature-detail-dialog.component.html',
  styleUrls: ['./signature-detail-dialog.component.scss']
})
export class SignatureDetailDialogComponent implements OnInit {
  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private meQuery: MeQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<SignatureDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public signature: EmailSignature
  ) {}

  ngOnInit() {
    if (this.signature.id === 0) {
      this.initSignature();
    }
  }

  initSignature() {
    const user = this.meQuery.getMe();
    this.signature.senderInfo = user.displayName;
    this.signature.content = `<div>—</div><div>${user.displayName}</div>`;
  }

  doUpdate() {
    if (!this.signature.name) {
      this.toastService.error('Please enter name.');
      return;
    }
    if (!this.signature.content) {
      this.toastService.error('Please enter signature.');
      return;
    }
    let observable: Observable<EmailSignature>;
    if (this.signature.id > 0) {
      observable = this.emailIntegrationService.updateSignature(this.signature);
    } else {
      observable = this.emailIntegrationService.createSignature(this.signature);
    }
    observable.subscribe(
      _ => {
        this.dialogRef.close();
        this.toastService.success(this.signature.id > 0 ? 'Update successfully.' : 'Create successfully.');
      },
      error => this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT)
    );
  }
}
