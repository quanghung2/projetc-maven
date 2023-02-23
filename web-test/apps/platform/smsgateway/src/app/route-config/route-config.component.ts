import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AdminOpsService, PromoteEntityType, PromoteReq, RealDomainService } from '@b3networks/api/auth';
import { ByoiRoute, ByoiRoutesQuery, ByoiRoutesService } from '@b3networks/api/sms';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { debounceTime, finalize, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { AddEditDialogComponent } from './add-edit-dialog/add-edit-dialog.component';

@Component({
  selector: 'b3n-route-config',
  templateUrl: './route-config.component.html',
  styleUrls: ['./route-config.component.scss']
})
export class RouteConfigComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns: string[] = ['orgName', 'srcPrefix', 'destPrefix', 'vendor', 'skuName', 'function'];
  form: UntypedFormGroup;
  byoiRoutes: ByoiRoute[];
  byoiRoutesPaging: ByoiRoute[];
  byoiRoutesFilter: ByoiRoute[];
  goToLast: boolean;
  pageSize = 10;
  pageStart = 0;
  loading = true;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private byoiRoutesQuery: ByoiRoutesQuery,
    private byoiRoutesService: ByoiRoutesService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private realDomainService: RealDomainService,
    private adminOpsService: AdminOpsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.promote();
    this.initForm();

    this.byoiRoutesService.getByoiRoutes().subscribe();

    this.byoiRoutesQuery
      .selectAll()
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(() => (this.loading = false))
      )
      .subscribe(byoiRoutes => {
        const defaultItemIndex = byoiRoutes.findIndex(
          b => (b.orgName === '*' || b.orgName === null) && b.srcPrefix === '*' && b.destPrefix === '*'
        );

        if (defaultItemIndex > -1) {
          const defaultItem = byoiRoutes.splice(defaultItemIndex, 1);
          byoiRoutes.unshift(defaultItem[0]);
        }

        this.byoiRoutes = [...byoiRoutes];
        this.byoiRoutesFilter = [...byoiRoutes];

        if (this.pageStart && this.pageStart === this.byoiRoutes.length) {
          this.pageStart -= this.pageSize;
          this.paginator.pageIndex = this.paginator.pageIndex - 1;
        }

        this.byoiRoutesPaging = this.byoiRoutes.slice(this.pageStart, this.pageStart + this.pageSize);
      });
  }

  promote() {
    this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(
        mergeMap(result => {
          return this.adminOpsService.promote(<PromoteReq>{
            entityType: PromoteEntityType.domain,
            entityUuid: result.domain
          });
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      search: ['']
    });

    this.form.controls['search'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(300),
        tap((keyword: string) => {
          this.byoiRoutesFilter = this.byoiRoutes.filter(b =>
            b.vendor.toLowerCase().includes(keyword.trim().toLowerCase())
          );
          this.byoiRoutesPaging = this.byoiRoutesFilter.slice(this.pageStart, this.pageStart + this.pageSize);

          if (keyword === '' && this.goToLast) {
            this.goToLast = false;
            this.paginator.lastPage();
          }

          if (keyword !== '') {
            this.paginator.firstPage();
          }
        })
      )
      .subscribe();
  }

  refresh() {
    this.pageStart = 0;
    this.loading = true;
    this.byoiRoutesService.getByoiRoutes().subscribe();
  }

  editOrDel(type: 'Edit' | 'Delete', byoiRoute: ByoiRoute) {
    if (type === 'Edit') {
      this.openDialog(type, byoiRoute);
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        disableClose: true,
        data: {
          title: 'Delete rule',
          message: 'Are you sure to delete this route?',
          confirmLabel: 'Confirm',
          color: 'warn'
        },
        width: '500px'
      })
      .afterClosed()
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => this.form.controls['search'].setValue('')),
        tap(confirmed => {
          if (confirmed) {
            this.byoiRoutesService.deleteByoiRoutes(byoiRoute.id).subscribe(
              _ => this.toastService.success(`Delete route successfully`),
              err => this.toastService.warning(err.message)
            );
          }
        })
      )
      .subscribe();
  }

  openDialog(title: string, byoiRoute: ByoiRoute) {
    const dialogRef = this.dialog.open(AddEditDialogComponent, {
      disableClose: true,
      data: {
        title,
        byoiRoute
      },
      autoFocus: false
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap((res: { isAdd: boolean }) => {
          if (res) {
            this.form.controls['search'].setValue('');
            this.refresh();
          }
        })
      )
      .subscribe();
  }

  page(e: PageEvent) {
    const condition = e.pageIndex * e.pageSize;

    if (this.pageStart === condition) {
      this.paginator.previousPage();
      return;
    }

    this.pageStart = condition;
    this.byoiRoutesPaging =
      this.pageStart - 1 < 0
        ? this.byoiRoutesFilter.slice(0, this.pageSize)
        : this.byoiRoutesFilter.slice(this.pageStart, this.pageStart + this.pageSize);
  }
}
