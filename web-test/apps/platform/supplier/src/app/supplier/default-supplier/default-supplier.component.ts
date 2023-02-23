import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Supplier, SupplierQuery, SupplierService } from '@b3networks/api/supplier';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-default-supplier',
  templateUrl: './default-supplier.component.html',
  styleUrls: ['./default-supplier.component.scss']
})
export class DefaultSupplierComponent implements OnInit {
  sourceSuppliers: Supplier[];
  sourceDefaultSuppliers: Supplier[] = [];
  changing = false;
  formSetDefaultSupplier: UntypedFormGroup;

  get defaultSupplierUuid(): UntypedFormControl {
    return this.formSetDefaultSupplier.get('defaultSupplierUuid') as UntypedFormControl;
  }

  get supplierUuids(): UntypedFormControl {
    return this.formSetDefaultSupplier.get('supplierUuids') as UntypedFormControl;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public supplierUuid: string,
    private dialogRef: MatDialogRef<DefaultSupplierComponent>,
    private fb: UntypedFormBuilder,
    private supplierService: SupplierService,
    private supplierQuery: SupplierQuery,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.sourceSuppliers = this.supplierQuery.getAll();

    this.formSetDefaultSupplier = this.fb.group({
      defaultSupplierUuid: [null, Validators.required],
      supplierUuids: [null, Validators.required]
    });

    this.supplierUuids.valueChanges.subscribe(uuids => {
      this.sourceDefaultSuppliers = this.sourceSuppliers.filter(s => s.uuid === uuids.find(x => x === s.uuid));
      if (!uuids.find(uuid => uuid === this.defaultSupplierUuid.value)) {
        this.defaultSupplierUuid.setValue(null);
      }
    });

    this.supplierService.getDefaultSupplier(this.supplierUuid).subscribe(seller => {
      this.formSetDefaultSupplier.patchValue({
        defaultSupplierUuid: seller.defaultSupplier.supplierUuid,
        supplierUuids: seller.supportedSuppliers.map(s => s.supplierUuid)
      });
    });
  }

  showConfirm() {
    if (this.formSetDefaultSupplier.valid) {
      const data = this.sourceDefaultSuppliers.find(s => s.uuid === this.defaultSupplierUuid.value);
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '400px',
          data: <ConfirmDialogInput>{
            title: `Confirm`,
            message: `This change will affect immediately. Are you sure to switch all traffic to <strong>${data.name}</strong>?`,
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(res => {
          if (res) {
            this.changing = true;
            this.supplierService
              .updateDefaultSupplier(this.supplierUuid, this.formSetDefaultSupplier.value)
              .pipe(finalize(() => (this.changing = false)))
              .subscribe(
                res => {
                  this.toastService.success('Update successfully');
                  this.dialogRef.close(true);
                },
                err => {
                  this.toastService.error(err.message);
                }
              );
          }
        });
    }
  }
}
