import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Supplier } from '@b3networks/api/workspace';

export interface SelectSupplierInput {
  currentOrgUuid: string;
  selectedSupplier: string;
  suppliers: Supplier[];
}

@Component({
  selector: 'b3n-select-supplier',
  templateUrl: './select-supplier.component.html',
  styleUrls: ['./select-supplier.component.scss']
})
export class SelectSupplierComponent {
  selectedOrgFC: FormControl;

  constructor(
    private dialogRef: MatDialogRef<SelectSupplierComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SelectSupplierInput,
    private fb: FormBuilder
  ) {
    this.selectedOrgFC = this.fb.control(this.data.selectedSupplier, Validators.required);
  }

  submit2MyOrg() {
    this.dialogRef.close(this.data.currentOrgUuid);
  }

  submitTo() {
    this.dialogRef.close(this.selectedOrgFC.value);
  }
}
