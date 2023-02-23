import { Component, Inject, OnInit } from '@angular/core';
import { CreateEmailInboxRequest, EmailInbox, EmailIntegrationService, MeQuery } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'b3n-inbox-detail-dialog',
  templateUrl: './inbox-detail-dialog.component.html',
  styleUrls: ['./inbox-detail-dialog.component.scss']
})
export class InboxDetailDialogComponent implements OnInit {
  isCreatingDone = false;

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private meQuery: MeQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<InboxDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public emailInbox: EmailInbox
  ) {}

  ngOnInit() {}

  doUpdate() {
    if (!this.emailInbox.name) {
      this.toastService.error('Please enter name.');
      return;
    }
    if (!this.emailInbox.incommingEmail) {
      this.toastService.error('Please enter email address.');
      return;
    }

    if (this.emailInbox.uuid) {
      this.emailIntegrationService.updateInbox(this.emailInbox).subscribe(
        _ => {
          this.dialogRef.close();
          this.toastService.success('Update successfully.');
        },
        error => this.showError(error)
      );
    } else {
      const request: CreateEmailInboxRequest = {
        name: this.emailInbox.name,
        email: this.emailInbox.incommingEmail
      };
      this.isCreatingDone = false;
      this.emailIntegrationService.createInbox(request).subscribe(
        response => {
          this.emailInbox.forwardEmail = response.forwardEmail;
          this.isCreatingDone = true;
        },
        error => this.showError(error)
      );
    }
  }

  private showError(error: HttpErrorResponse) {
    this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT);
  }
}
