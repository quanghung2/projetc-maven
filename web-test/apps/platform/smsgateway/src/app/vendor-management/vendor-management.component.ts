import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Vendor, VendorService } from '@b3networks/api/sms';
import { DestroySubscriberComponent, DomainUtilsService } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { finalize, tap } from 'rxjs/operators';
import { StoreVendorDialogComponent } from './store-vendor-dialog/store-vendor-dialog.component';

interface VendorState {
  vendor: Vendor;
  hidePassword: boolean;
}

enum STATUS_ORDER {
  'ENABLED',
  'DISABLED'
}

@Component({
  selector: 'b3n-vendor-management',
  templateUrl: './vendor-management.component.html',
  styleUrls: ['./vendor-management.component.scss']
})
export class VendorManagementComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns = ['label', 'username', 'password', 'postbackUrl', 'status', 'functions'];
  dataSource: MatTableDataSource<Vendor>;
  loading = true;
  changingStatus = false;
  vendorHash: HashMap<VendorState> = {};

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private vendorService: VendorService,
    public domainUtil: DomainUtilsService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.initData();
  }

  initData() {
    this.loading = true;

    this.vendorService
      .getVendors()
      .pipe(
        tap(vendors => {
          vendors.forEach(vendor => {
            this.vendorHash[vendor.name] = {
              vendor,
              hidePassword: true
            };
          });

          this.dataSource = new MatTableDataSource(
            vendors.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.label?.localeCompare(b.label))
          );

          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
          }, 0);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  setupFilter() {
    this.dataSource.filterPredicate = (source: Vendor, filter: string) => {
      const textToSearch = (source.name && source.name.toLowerCase()) || '';
      return textToSearch.indexOf(filter) !== -1;
    };
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  refresh() {
    this.initData();
  }

  openDialog(title: string, vendor: Vendor) {
    this.dialog
      .open(StoreVendorDialogComponent, {
        disableClose: true,
        data: {
          title,
          vendor
        },
        autoFocus: false
      })
      .afterClosed()
      .pipe(
        tap((res: { isAdd: boolean }) => {
          if (res) {
            this.refresh();
          }
        })
      )
      .subscribe();
  }

  changeStatus(code: string, name: string, vendor: Vendor) {
    this.changingStatus = true;

    const obs =
      vendor.status === 'ENABLED'
        ? this.vendorService.disableVendor(code, name)
        : this.vendorService.enableVendor(code, name);

    obs.subscribe(
      () => {
        this.toastService.success(`${vendor.status === 'ENABLED' ? 'Disable' : 'Enable'} vendor successfully`);
        vendor.status = vendor.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
        this.changingStatus = false;
      },
      err => {
        this.toastService.warning(err.message);
        this.changingStatus = false;
      }
    );
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  isMaxEnabledVendors(maxEnabledVendors = 10) {
    if (!this.dataSource?.data) {
      return false;
    }

    const vendors: Vendor[] = this.dataSource.data;
    const enabledVendorsCount: number = vendors.filter(v => v.status === 'ENABLED').length;

    return enabledVendorsCount >= maxEnabledVendors;
  }
}
