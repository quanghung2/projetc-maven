import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Flow } from '@b3networks/api/flow';

export class ImportFlowDialogRes {
  action: 'view' | 'resolve';
}

@Component({
  selector: 'b3n-import-flow-dialog',
  templateUrl: './import-flow-dialog.component.html',
  styleUrls: ['./import-flow-dialog.component.scss']
})
export class ImportFlowDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public flow: Flow, private dialogRef: MatDialogRef<ImportFlowDialogComponent>) {}

  view() {
    this.dialogRef.close(<ImportFlowDialogRes>{ action: 'view' });
  }

  resolve() {
    this.dialogRef.close(<ImportFlowDialogRes>{ action: 'resolve' });
  }
}
