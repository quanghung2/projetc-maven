import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResolveDependencyInput } from '@b3networks/api/flow';

@Component({
  selector: 'b3n-resolve-dependency-dialog',
  templateUrl: './resolve-dependency-dialog.component.html',
  styleUrls: ['./resolve-dependency-dialog.component.scss']
})
export class ResolveDependencyDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ResolveDependencyInput,
    public dialogRef: MatDialogRef<ResolveDependencyDialogComponent>
  ) {}
}
