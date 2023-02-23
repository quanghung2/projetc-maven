import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteItemData {
  displayText: string;
  key: string;
}
@Component({
  selector: 'b3n-delete-item-dialog',
  templateUrl: './delete-item-dialog.component.html',
  styleUrls: ['./delete-item-dialog.component.scss']
})
export class DeleteItemDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteItemData
  ) {}

  delete() {
    this.dialogRef.close(true);
  }
}
