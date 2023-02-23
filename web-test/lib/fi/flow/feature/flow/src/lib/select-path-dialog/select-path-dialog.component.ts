import { Component, Inject } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Path } from '@b3networks/api/flow';

export interface SelectPathInput {
  paths: Path[];
  isHiddenDeleteAllPaths: boolean;
  title: string;
  message: string;
}

@Component({
  selector: 'b3n-select-path-dialog',
  templateUrl: './select-path-dialog.component.html',
  styleUrls: ['./select-path-dialog.component.scss']
})
export class SelectPathDialogComponent {
  selectedPath = new UntypedFormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: SelectPathInput,
    private dialogRef: MatDialogRef<SelectPathDialogComponent>
  ) {}

  skipAnDelete() {
    this.dialogRef.close({ skip: true });
  }
  checkDependencies() {
    this.dialogRef.close({ skip: false, value: this.selectedPath.value });
  }
}
