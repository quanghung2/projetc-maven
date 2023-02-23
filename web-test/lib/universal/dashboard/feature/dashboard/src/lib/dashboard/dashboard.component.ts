import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IAM_DASHBOARD_ACTIONS, IAM_SERVICES, IdentityProfileService, MeIamQuery } from '@b3networks/api/auth';
import { Dashboard, DashboardService } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { uniq } from 'lodash';
import { combineLatest } from 'rxjs';
import { debounceTime, finalize, skip, startWith, takeUntil, tap } from 'rxjs/operators';
import { PublicAccessComponent } from '../public-access/public-access.component';
import { StoreDashboardComponent } from '../store-dashboard/store-dashboard.component';

const SELECT_ALL = 'SELECT_ALL';

@Component({
  selector: 'b3n-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns: string[] = ['name', 'service', 'lastUpdated'];
  dataSource: MatTableDataSource<Dashboard>;
  data: Dashboard[] = [];

  editable: boolean;

  serviceOptions: string[] = [];
  key = this.fb.control('');
  service = this.fb.control(SELECT_ALL);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly SELECT_ALL = SELECT_ALL;

  constructor(
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private spinner: LoadingSpinnerSerivce,
    private toastService: ToastService,
    private iamQuery: MeIamQuery,
    private fb: UntypedFormBuilder,
    private profileService: IdentityProfileService
  ) {
    super();
  }

  ngOnInit() {
    this.profileService
      .getProfile()
      .pipe(
        tap(profile => {
          const org = profile.organizations[0];

          if (!org.licenseEnabled) {
            this.initDashboardV1();
          }
        })
      )
      .subscribe();
  }

  initDashboardV1() {
    this.reload();
    this.iamQuery
      .selectHasGrantedPermission(IAM_SERVICES.dashboard, IAM_DASHBOARD_ACTIONS.manage)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(hasPermission => {
        this.editable = hasPermission;
        const actionIndex = this.displayedColumns.indexOf('actions');
        if (this.editable && actionIndex === -1) {
          this.displayedColumns.push('actions');
        } else if (!this.editable && actionIndex > -1) {
          this.displayedColumns.splice(actionIndex, 1);
        }
      });

    combineLatest([
      this.key.valueChanges.pipe(startWith(''), debounceTime(300)),
      this.service.valueChanges.pipe(startWith(this.service.value))
    ])
      .pipe(skip(1), takeUntil(this.destroySubscriber$))
      .subscribe(([key, service]) => {
        const filter = this.data.filter(
          item =>
            (!!key ? item.name?.toUpperCase().indexOf(key?.trim()?.toUpperCase()) > -1 : true) &&
            (!!service && service !== SELECT_ALL ? item.formatedServiceName?.toUpperCase() === service : true)
        );

        this.dataSource.data = this.sortLastModified(filter);
        this.paginator.pageIndex = 0;
      });
  }

  onRefresh() {
    this.key.setValue('');
    this.service.setValue(SELECT_ALL);
    this.reload();
  }

  store(dashboard?: Dashboard) {
    this.dialog
      .open(StoreDashboardComponent, {
        width: '500px',
        data: dashboard
      })
      .afterClosed()
      .subscribe(stored => {
        if (stored) {
          this.reload();
        }
      });
  }

  remove(dashboard: Dashboard) {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: '400px',
        data: <ConfirmDialogInput>{
          title: 'Remove chart',
          message: `Do you want to remove dashboad ${dashboard.name}?`,
          confirmLabel: 'Remove',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(accepted => {
        if (accepted) {
          this.dashboardService.delete(dashboard).subscribe(_ => {
            this.toastService.success(`Removed dashboard successfully.`);
            this.reload();
          });
        }
      });
  }

  getPublicLink(dashboad: Dashboard) {
    this.dialog.open(PublicAccessComponent, {
      width: '500px',
      data: dashboad
    });
  }

  reload() {
    this.spinner.showSpinner();
    this.dashboardService
      .fetchAll()
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => this.spinner.hideSpinner())
      )
      .subscribe(dashboards => {
        this.data = dashboards;

        const services = dashboards?.map(x => x.formatedServiceName?.toLocaleUpperCase());
        this.serviceOptions = uniq(services);

        if (!this.dataSource) {
          this.dataSource = new MatTableDataSource<Dashboard>(this.sortLastModified(dashboards));
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
          }, 0);
        } else {
          this.dataSource.data = this.sortLastModified(dashboards);
        }
      });
  }

  private sortLastModified(data: Dashboard[]) {
    return data.sort((a, b) => (a.name < b.name ? -1 : 1));
  }
}
