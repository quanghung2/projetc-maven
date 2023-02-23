import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogInput {
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  color: string;
  hideCancel?: boolean;
  textConfirm?: string;
}

@Component({
  selector: 'b3n-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogInput
  ) {}

  ngOnInit() {}

  confirm() {
    this.dialogRef.close(true);
  }
}
