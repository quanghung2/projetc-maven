import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthorConnector } from '@b3networks/api/flow';

export interface CreateDefinitionDialogInput {
  connector: AuthorConnector;
}

@Component({
  selector: 'b3n-create-definition-dialog',
  templateUrl: './create-definition-dialog.component.html',
  styleUrls: ['./create-definition-dialog.component.scss']
})
export class CreateDefinitionDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateDefinitionDialogInput,
    private dialogRef: MatDialogRef<CreateDefinitionDialogComponent>
  ) {}

  select(type: string) {
    this.dialogRef.close(type);
  }
}
