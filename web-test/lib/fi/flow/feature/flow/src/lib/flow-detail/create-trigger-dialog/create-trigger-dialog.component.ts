import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TriggerDef } from '@b3networks/api/flow';

export interface CreateTriggerDialogInput {
  type: 'NORMAL' | 'SUBROUTINE' | 'BUSINESS_ACTION';
  triggerSelected: TriggerDef;
}

@Component({
  selector: 'b3n-create-trigger-dialog',
  templateUrl: './create-trigger-dialog.component.html',
  styleUrls: ['./create-trigger-dialog.component.scss']
})
export class CreateTriggerDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateTriggerDialogInput,
    private dialogRef: MatDialogRef<CreateTriggerDialogComponent>
  ) {}

  onClose(value: boolean) {
    this.dialogRef.close(value);
  }
}
