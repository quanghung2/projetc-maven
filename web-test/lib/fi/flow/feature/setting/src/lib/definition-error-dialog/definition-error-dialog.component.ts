import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DefinitionErrorDialogInput {
  message: string;
  definitions: {
    [key: string]: string;
  };
}

@Component({
  selector: 'b3n-definition-error-dialog',
  templateUrl: './definition-error-dialog.component.html',
  styleUrls: ['./definition-error-dialog.component.scss']
})
export class DefinitionErrorDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DefinitionErrorDialogInput) {}
}
