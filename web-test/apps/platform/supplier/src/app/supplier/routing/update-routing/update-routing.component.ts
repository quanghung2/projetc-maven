import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SellerRouting, SellerRoutingType, SupplierSeller, SupplierService } from '@b3networks/api/supplier';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface OpenDialogUpdateRoutingReq {
  sellerUuid: string;
  sellerRouting: SellerRouting;
}

@Component({
  selector: 'b3n-update-routing',
  templateUrl: './update-routing.component.html',
  styleUrls: ['./update-routing.component.scss']
})
export class UpdateRoutingComponent implements OnInit {
  ctaActionName: string = 'Create';
  supportedSuppliers: SupplierSeller[];
  formRouting: UntypedFormGroup;
  updating = false;

  readonly supportedTypes: SellerRoutingType[] = [
    SellerRoutingType.CALL_INCOMING,
    SellerRoutingType.CALL_OUTGOING,
    SellerRoutingType.FAX_INCOMING,
    SellerRoutingType.FAX_OUTGOING,
    SellerRoutingType.SMS_INCOMING,
    SellerRoutingType.SMS_OUTGOING
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) private inputDialog: OpenDialogUpdateRoutingReq,
    private dialogRef: MatDialogRef<UpdateRoutingComponent>,
    private fb: UntypedFormBuilder,
    private supplierService: SupplierService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.supplierService.getDefaultSupplier(this.inputDialog.sellerUuid).subscribe(seller => {
      this.supportedSuppliers = seller.supportedSuppliers;
    });

    this.formRouting = this.fb.group({
      supplierUuid: ['', Validators.required],
      type: [null, Validators.required],
      orgUuid: ['', Validators.required]
    });

    if (this.inputDialog.sellerRouting) {
      this.ctaActionName = 'Update';
      const sellerRouting = this.inputDialog.sellerRouting;
      this.formRouting.patchValue({
        supplierUuid: sellerRouting.supplier.uuid,
        type: sellerRouting.type,
        orgUuid: sellerRouting.orgUuid
      });
      this.formRouting.get('type').disable();
      this.formRouting.get('orgUuid').disable();
    }
  }

  update() {
    if (this.formRouting.valid) {
      this.updating = true;
      if (this.ctaActionName == 'Update') {
        this.supplierService
          .updateSellerRouting(this.inputDialog.sellerUuid, this.formRouting.getRawValue())
          .pipe(finalize(() => (this.updating = false)))
          .subscribe(
            _ => {
              this.toastService.success('Update successfully');
              this.dialogRef.close(true);
            },
            err => {
              this.toastService.error(err.message);
            }
          );
      } else {
        this.supplierService
          .createSellerRouting(this.inputDialog.sellerUuid, this.formRouting.value)
          .pipe(finalize(() => (this.updating = false)))
          .subscribe(
            _ => {
              this.toastService.success('Create successfully');
              this.dialogRef.close(true);
            },
            err => {
              this.toastService.error(err.message);
            }
          );
      }
    }
  }
}
