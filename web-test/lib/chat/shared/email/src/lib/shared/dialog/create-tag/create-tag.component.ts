import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { EmailIntegrationService, EmailTag } from '@b3networks/api/workspace';
import { MessageConstants } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-email-create-tag-modal',
  templateUrl: './create-tag.component.html',
  styleUrls: ['./create-tag.component.scss']
})
export class CreateTagComponent {
  tag = new EmailTag();
  processing = false;
  error: string;
  colorList: string[] = [
    '#5151E1',
    '#E15151',
    '#E19951',
    '#E1E151',
    '#99E151',
    '#51E151',
    '#51E199',
    '#51E1E1',
    '#5199E1',
    '#9951E1',
    '#E151E1',
    '#E15199'
  ];

  constructor(private dialogRef: MatDialogRef<CreateTagComponent>, private service: EmailIntegrationService) {}

  create() {
    if (!this.tag.name) {
      this.error = 'Please enter name.';
      return;
    }
    this.service.createTag(this.tag).subscribe(
      () => {
        this.dialogRef.close({ success: true });
      },
      err => {
        if (err.error.code === 'workspace.duplicateEntry') {
          this.error = 'This tag is existing';
        } else {
          this.error = MessageConstants.DEFAULT;
        }
      }
    );
  }
}
