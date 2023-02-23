import { Component, Inject } from '@angular/core';
import { EmailIntegrationService, EmailSignature, EmailTag, MeQuery } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MessageConstants } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-tag-detail-dialog',
  templateUrl: './tag-detail-dialog.component.html',
  styleUrls: ['./tag-detail-dialog.component.scss']
})
export class TagDetailDialogComponent {
  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private meQuery: MeQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<TagDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public emailTag: EmailTag
  ) {}

  doUpdate() {
    if (!this.emailTag.name) {
      this.toastService.error('Please enter name.');
      return;
    }

    let observable: Observable<EmailSignature>;
    if (this.emailTag.id > 0) {
      observable = this.emailIntegrationService.updateTag(this.emailTag);
    } else {
      observable = this.emailIntegrationService.createTag(this.emailTag);
    }
    observable.subscribe(
      _ => {
        this.dialogRef.close();
        this.toastService.success(this.emailTag.id > 0 ? 'Update successfully.' : 'Create successfully.');
      },
      error => this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT)
    );
  }
}
