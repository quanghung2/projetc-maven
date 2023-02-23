import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmLinkDialogData {
  user: string;
  extension: string;
}

@Component({
  selector: 'pos-confirm-link-dialog',
  templateUrl: './confirm-link-dialog.component.html',
  styleUrls: ['./confirm-link-dialog.component.scss']
})
export class ConfirmLinkDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmLinkDialogData) {}
}
