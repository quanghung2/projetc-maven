import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SellerRoutingService, SupplierSeller, SupplierService } from '@b3networks/api/supplier';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-default-supplier',
  templateUrl: './default-supplier.component.html',
  styleUrls: ['./default-supplier.component.scss']
})
export class DefaultSupplierComponent implements OnInit {
  defaultSupplierUuid: string;
  supportedSuppliers: SupplierSeller[];
  isLoading = false;
  changing = false;

  constructor(
    private supplierService: SupplierService,
    private sellerRoutingService: SellerRoutingService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<DefaultSupplierComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSeller();
  }

  loadSeller() {
    this.isLoading = true;
    this.supplierService
      .getSeller()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(seller => {
        this.defaultSupplierUuid = seller.defaultSupplier.supplierUuid;
        this.supportedSuppliers = seller.supportedSuppliers;
      });
  }

  showConfirm() {
    const data = this.supportedSuppliers.find(s => s.supplierUuid === this.defaultSupplierUuid);
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: `Change default supplier`,
          message: `This change will affect immediately. Are you sure to switch all traffic to <strong>${data.name}</strong>?`,
          confirmLabel: 'Confirm',
          cancelLabel: 'Cancel',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.updateDefaultSupplier();
        }
      });
  }

  updateDefaultSupplier() {
    this.changing = true;
    this.sellerRoutingService
      .updateDefaultSupplier(this.defaultSupplierUuid)
      .pipe(finalize(() => (this.changing = false)))
      .subscribe(
        res => {
          this.dialogRef.close(true);
          this.toastService.success('Change successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
