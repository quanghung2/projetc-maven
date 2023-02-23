import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Bundle, BundleQuery, BundleService, BundleStatus, GetBundleReq } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as moment from 'moment';
import { combineLatest, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { AppState } from '../state/app-state.model';
import { AppStateQuery } from '../state/app-state.query';
import { AppStateService } from '../state/app-state.service';
import { StoreBundleComponent, StoreBundleInput } from './store-bundle/store-bundle.component';
import { ActionMapping, IAM_GROUP_UUIDS, IamQuery, IdentityProfileQuery } from '@b3networks/api/auth';

const InitData = {
  filter: {
    statuses: [
      { key: '', value: 'All' },
      { key: BundleStatus.active, value: 'Active' },
      { key: BundleStatus.deleted, value: 'Deleted' }
    ]
  }
};

@Component({
  selector: 'b3n-service-bundle',
  templateUrl: './service-bundle.component.html',
  styleUrls: ['./service-bundle.component.scss']
})
export class ServiceBundleComponent extends DestroySubscriberComponent implements OnInit {
  readonly InitData = InitData;
  readonly BundleStatus = BundleStatus;

  dataSource = new MatTableDataSource<Bundle>();

  loading$: Observable<boolean>;

  filterFG: UntypedFormGroup;

  readonly displayedColumns = [
    'id',
    'bundleUuid',
    'name',
    'description',
    'status',
    'updatedAt',
    'published',
    'actions'
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  actionMapping$: Observable<ActionMapping>;

  constructor(
    private bundleQuery: BundleQuery,
    private bundleService: BundleService,
    private appStateQuery: AppStateQuery,
    private appStateService: AppStateService,
    private dialog: MatDialog,
    private toastr: ToastService,
    private fb: UntypedFormBuilder,
    private iamQuery: IamQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.actionMapping$ = this.iamQuery.selectActionMapping(IAM_GROUP_UUIDS.businessHub);

    this.initControls();

    combineLatest([this.bundleQuery.selectAll(), this.filterFG.get('status').valueChanges])
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(([bundles, status]) => {
          const bundlesSort = bundles.sort((a, b) => {
            const dateA = moment(a.updatedAt);
            const dateB = moment(b.updatedAt);
            return dateB.diff(dateA);
          });

          this.dataSource.data = !!status ? bundlesSort.filter(b => b.status === status) : bundlesSort;
          this.dataSource.paginator = this.paginator;
        })
      )
      .subscribe();

    const initFilter = this.appStateQuery.bundleFilter;
    this.filterFG.get('status').setValue(initFilter?.status);

    this.dataSource.filterPredicate = (data: Bundle, filter: string) => {
      return data.name.toLocaleLowerCase().includes(filter?.toLocaleLowerCase());
    };

    this.loading$ = this.bundleQuery.selectLoading();
    this.refreshPage();
  }

  refreshPage() {
    this.bundleService.get(<GetBundleReq>{ statuses: [BundleStatus.active, BundleStatus.deleted] }).subscribe();
  }

  createOrUpdate(bundle?: Bundle) {
    this.dialog.open(StoreBundleComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      data: <StoreBundleInput>{
        bundle: bundle
      }
    });
  }

  deleteBundle(bundle: Bundle) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: `Delete bundle`,
          message: `This action cannot be revert, are you sure to delete bundle <strong>${bundle.name}</strong>? `,
          confirmLabel: `Delete`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.bundleService.remove(bundle.id).subscribe(
            _ => {
              this.toastr.success(`Delete bundle successfully.`);
            },
            error => {
              this.toastr.warning(error.message);
            }
          );
        }
      });
  }

  private initControls() {
    const initFilter = this.appStateQuery.bundleFilter;
    this.filterFG = this.fb.group({
      queryString: initFilter?.queryString || null,
      status: initFilter?.status || ''
    });

    this.filterFG.valueChanges.subscribe(filter => {
      this.dataSource.filter = filter.queryString;
      this.appStateService.updateFilter(<AppState>{ bundleFilter: filter });
    });
  }
}
