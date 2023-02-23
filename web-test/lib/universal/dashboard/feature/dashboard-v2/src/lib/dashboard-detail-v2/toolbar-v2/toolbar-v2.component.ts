import {
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { MatToolbar } from '@angular/material/toolbar';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { QueueService } from '@b3networks/api/callcenter';
import {
  Dashboard2,
  Dashboard2Card,
  DashboardV2Service,
  DASHBOARD_2_UUID,
  STORE_CONFIG_TOKEN
} from '@b3networks/api/dashboard';
import { DashboardV2AppSetting, DashboardV2AppSettingFilter, PersonalSettingsService } from '@b3networks/api/portal';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { isEqual } from 'lodash';
import { firstValueFrom } from 'rxjs';
import { debounceTime, filter, first, takeUntil, tap } from 'rxjs/operators';
import { StoreDashboardV2Component } from '../../store-dashboard-v2/store-dashboard-v2.component';

@Component({
  selector: 'b3n-toolbar-v2',
  templateUrl: './toolbar-v2.component.html',
  styleUrls: ['./toolbar-v2.component.scss'],
  providers: [
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'toolbar__overlay' }
    }
  ]
})
export class ToolbarV2Component extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() dashboard: Dashboard2;
  @Input() cards: Dashboard2Card[];
  @Input() dashboardV2AppSettings: DashboardV2AppSetting;
  @Input() canManage: boolean;
  @Output() filtersChanged = new EventEmitter<DashboardV2AppSettingFilter>();
  @ViewChild('toolbar') toolbar: MatToolbar;

  form: UntypedFormGroup;
  selectAllQueue = true;
  storedFilter: DashboardV2AppSettingFilter;
  starredUuids: string[] = [];
  currentOrg: ProfileOrg;
  showFilters: boolean;
  filtersWidth: number = 0;

  readonly OTHER_WIDTH = 100;

  constructor(
    private fb: UntypedFormBuilder,
    public dashboardV2Service: DashboardV2Service,
    private toastService: ToastService,
    private personalSettingsService: PersonalSettingsService,
    public dialog: MatDialog,
    @Inject(STORE_CONFIG_TOKEN) private storeConfig: HashMap<string>,
    private queueService: QueueService,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const width = event.target.innerWidth;
    this.showFilters = this.filtersWidth + this.OTHER_WIDTH < width;
  }

  ngOnChanges(change: SimpleChanges) {
    if (change['dashboard']) {
      this.showFilters = false;
    }
  }

  ngOnInit() {
    this.dashboardV2Service.fetchQueue$
      .pipe(
        filter(fetchQueue => !!fetchQueue),
        first(),
        tap(async _ => {
          const allQueues = await firstValueFrom(this.queueService.getQueuesFromCache());
          this.dashboardV2Service.allQueues$.next(allQueues);
        })
      )
      .subscribe();

    this.profileQuery.currentOrg$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(currentOrg => {
          this.currentOrg = currentOrg;
        })
      )
      .subscribe();

    this.dashboardV2Service.filtersWidthHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(filtersWidthHash => {
          const keys = Object.keys(filtersWidthHash);

          if (!keys.length) {
            this.showFilters = false;
          }
        }),
        debounceTime(200),
        tap(filtersWidthHash => {
          this.filtersWidth = 0;

          for (const key in filtersWidthHash) {
            this.filtersWidth += filtersWidthHash[key];
          }

          const width = (window?.parent || window)?.innerWidth;
          this.showFilters = this.filtersWidth + this.OTHER_WIDTH < width;
        })
      )
      .subscribe();

    this.dashboardV2Service.starredUuids$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(starredUuids => {
          this.starredUuids = starredUuids;
        })
      )
      .subscribe();

    this.storedFilter = this.dashboardV2AppSettings?.filters;
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      queues: [],
      dateTime: [],
      timeRange: this.fb.group({
        startDate: [''],
        endDate: ['']
      }),
      customDate: [],
      includeNonQueue: [],
      states: [],
      extensions: [],
      searchExt: ['']
    });

    if (this.storedFilter) {
      this.form.patchValue(this.storedFilter);
    }

    this.form.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(15000),
        tap(form => {
          const dashboardV2AppSetting: DashboardV2AppSetting = {
            appId: DASHBOARD_2_UUID,
            orgUuid: X.orgUuid,
            filters: form,
            autoScroll: !!this.dashboardV2AppSettings?.autoScroll,
            starredUuids: this.dashboardV2AppSettings?.starredUuids,
            autoScrollThreshold: this.dashboardV2AppSettings?.autoScrollThreshold ?? 30
          };

          if (!isEqual(this.storedFilter, form)) {
            this.storedFilter = form;
            this.filtersChanged.emit(this.storedFilter);

            if (this.dashboardV2Service.isTV$.getValue()) {
              return;
            }

            this.personalSettingsService.updateAppSettings(dashboardV2AppSetting).subscribe();
          }
        })
      )
      .subscribe();
  }

  setSelectAllQueue(checked: boolean) {
    this.selectAllQueue = checked;
  }

  storeDashboardV2() {
    this.dashboardV2Service.isPopupOpening$.next(true);
    this.dialog
      .open(StoreDashboardV2Component, {
        ...this.storeConfig,
        data: {
          dashboard: this.dashboard,
          cards: this.cards
        },
        disableClose: true
      })
      .afterClosed()
      .pipe(
        tap(res => {
          this.dashboardV2Service.isStoreSuccess$.next(res);
          this.dashboardV2Service.isPopupOpening$.next(false);
        })
      )
      .subscribe();
  }

  deleteDashboard() {
    if (!this.dashboard.isDefault && this.starredUuids.length === 1 && this.starredUuids[0] === this.dashboard.uuid) {
      this.toastService.warning(`Please unstar this dashboard first before deleting`);
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: `400px`,
        data: {
          message: `Are you sure you want to delete this dashboard?`,
          title: `Confirm`
        }
      })
      .afterClosed()
      .subscribe(async confirmed => {
        if (confirmed) {
          try {
            await this.dashboardV2Service.deleteDashboard(this.dashboard.uuid).toPromise();
            this.toastService.success('Delete successfully');
            this.dashboardV2Service.dashboard2TabsChanged$.next('');
          } catch (e) {
            this.toastService.error(e['message']);
          }
        }
      });
  }

  isMenuOpened(isOpened: boolean) {
    this.dashboardV2Service.isPopupOpening$.next(isOpened);
  }

  get queues() {
    return this.form?.controls['queues'];
  }

  get timeRange() {
    return this.form?.controls['timeRange'];
  }

  get includeNonQueue() {
    return this.form?.controls['includeNonQueue'];
  }
}
