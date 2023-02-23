import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AdminApp, PartnerService } from '@b3networks/api/partner';
import { finalize, tap } from 'rxjs/operators';
import { StoreAdminAppAccessComponent } from '../store/store-admin-app-access/store-admin-app-access.component';

@Component({
  selector: 'b3n-admin-app-access',
  templateUrl: './admin-app-access.component.html',
  styleUrls: ['./admin-app-access.component.scss']
})
export class AdminAppAccessComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayColumns: string[] = ['name', 'visibilityType', 'visibilityExceptions', 'actions'];
  loading: boolean;
  dataSource: MatTableDataSource<AdminApp>;
  adminApps: AdminApp[];

  MAX_VISIBILITY_EXCEPTION = 4;

  constructor(public dialog: MatDialog, private partnerSerivce: PartnerService) {}

  ngOnInit(): void {
    this.initData();
  }

  initData() {
    this.loading = true;
    this.partnerSerivce
      .getAdminApps()
      .pipe(
        tap(adminApps => {
          this.adminApps = adminApps.sort((a, b) => a.name.localeCompare(b.name));
          this.dataSource = new MatTableDataSource(this.adminApps);

          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
          }, 0);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  setupFilter() {
    this.dataSource.filterPredicate = (source: AdminApp, filter: string) => {
      const textToSearch = (source.name && source.name.toLowerCase()) || '';
      return textToSearch.indexOf(filter) !== -1;
    };
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openStoreAdminAppAccess(adminApp?: AdminApp): void {
    this.dialog
      .open(StoreAdminAppAccessComponent, {
        width: '500px',
        data: { adminApp },
        autoFocus: false,
        disableClose: true
      })
      .afterClosed()
      .subscribe((res: AdminApp) => {
        if (!res) {
          return;
        }

        this.initData();
      });
  }
}
