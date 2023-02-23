import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateEmailInboxRequest, EmailIntegrationService } from '@b3networks/api/workspace';
import { MessageConstants } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-create-inbox-dlg',
  templateUrl: './create-inbox.component.html',
  styleUrls: ['./create-inbox.component.scss']
})
export class CreateInboxDialogComponent {
  loading = false;
  name: string;
  email: string;
  forwardEmail: string;
  finish = false;
  error = '';

  constructor(
    public dialogRef: MatDialogRef<CreateInboxDialogComponent>,
    private emailIntegrationService: EmailIntegrationService
  ) {}

  create() {
    this.error = '';
    if (this.name && this.email) {
      this.loading = true;
      const newInbox: CreateEmailInboxRequest = { name: this.name, email: this.email };
      this.emailIntegrationService.createInbox(newInbox).subscribe(
        inbox => {
          this.forwardEmail = inbox.forwardEmail;
          this.finish = true;
          this.loading = false;
        },
        _ => {
          this.loading = false;
          this.error = MessageConstants.GENERAL_ERROR;
        }
      );
    }
  }

  finishSetup() {
    this.loading = true;
    setTimeout(() => {
      this.dialogRef.close();
    }, 0);
  }
}
