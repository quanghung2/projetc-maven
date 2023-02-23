import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDeleteActionDialog {
  title: string;
  message: string;
  isShowChecked: boolean;
  buttons: ConfirmChangeActionButton[];
}

export interface ConfirmChangeActionButton {
  type: string;
  label: string;
  action: string;
  color: string;
}

export interface ConfirmDeleteOuput {
  isChecked: boolean;
  action: string;
}

@Component({
  selector: 'b3n-confirm-delete-action-dialog',
  templateUrl: './confirm-delete-action-dialog.component.html',
  styleUrls: ['./confirm-delete-action-dialog.component.scss']
})
export class ConfirmDeleteActionDialogComponent {
  isChecked: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteActionDialog,
    private dialogRef: MatDialogRef<ConfirmDeleteActionDialogComponent>
  ) {}

  confirm(action: string) {
    this.dialogRef.close(<ConfirmDeleteOuput>{ isChecked: this.isChecked, action });
  }
}
