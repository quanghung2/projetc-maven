import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SellerRouting, SupplierService } from '@b3networks/api/supplier';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, startWith } from 'rxjs/operators';
import { OpenDialogUpdateRoutingReq, UpdateRoutingComponent } from './update-routing/update-routing.component';

@Component({
  selector: 'b3n-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class RoutingComponent extends DestroySubscriberComponent implements OnInit {
  @Input() sellerUuid: string;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  isLoading: boolean;
  filterCtrl: UntypedFormControl;
  routings: SellerRouting[];
  filteredRoutings: MatTableDataSource<SellerRouting>;
  displayColumns = ['orgUuid', 'orgName', 'type', 'supplier', 'updatedDate', 'action'];

  constructor(private dialog: MatDialog, private supplierService: SupplierService, private toastService: ToastService) {
    super();
  }

  ngOnInit(): void {
    this.filterCtrl = new UntypedFormControl();
    this.reload();
  }

  reload() {
    this.isLoading = true;
    this.supplierService
      .getSellerRouting(this.sellerUuid)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        routings => {
          this.routings = routings;

          this.filterCtrl.valueChanges.pipe(startWith('')).subscribe(val => {
            this.filteredRoutings = new MatTableDataSource(
              this.routings.filter(r => r.supplier.name.toLowerCase().indexOf(val) >= 0)
            );
            setTimeout(() => {
              this.filteredRoutings.paginator = this.paginator;
            });
          });
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  updateRouting(routing?: SellerRouting) {
    this.dialog
      .open(UpdateRoutingComponent, {
        width: '400px',
        data: <OpenDialogUpdateRoutingReq>{ sellerUuid: this.sellerUuid, sellerRouting: routing } || null
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.reload();
        }
      });
  }

  deleteRouting(routing: SellerRouting) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: `Delete Routing`,
          message: `You want to delete routing <strong>${routing.orgUuid} ${routing.type}</strong>?`,
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.supplierService
            .deleteSellerRouting(this.sellerUuid, {
              supplierUuid: routing.supplier.uuid,
              type: routing.type,
              orgUuid: routing.orgUuid
            })
            .subscribe(
              res => {
                this.toastService.success('Delete successfully');
                this.reload();
              },
              err => {
                this.toastService.error(err.message);
              }
            );
        }
      });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }
}
