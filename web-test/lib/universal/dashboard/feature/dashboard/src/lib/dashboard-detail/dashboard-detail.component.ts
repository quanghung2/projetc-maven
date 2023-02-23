import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { IAM_DASHBOARD_ACTIONS, IAM_SERVICES, MeIamQuery, OrganizationService } from '@b3networks/api/auth';
import { Card, CardService, Dashboard, DashboardService, FilterData } from '@b3networks/api/dashboard';
import { DashboardAppDashboardSetting } from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { APP_IDS, DestroySubscriberComponent, TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import {
  CompactType,
  DisplayGrid,
  GridsterConfig,
  GridsterItem,
  GridsterItemComponentInterface,
  GridType
} from 'angular-gridster2';
import { addDays, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { forkJoin, Subject, throwError, timer } from 'rxjs';
import { catchError, filter, finalize, mergeMap, takeUntil } from 'rxjs/operators';
import { AddCardComponent, AddCardReq } from './add-card/add-card.component';

enum viewMode {
  publicAccess = 'public'
}

@Component({
  selector: 'b3n-dashboard-detail',
  templateUrl: './dashboard-detail.component.html',
  styleUrls: ['./dashboard-detail.component.scss']
})
export class DashboardDetailComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  filter: FilterData;

  dashboardUuid: string;
  dashboard: Dashboard;
  cards: Array<Card>;

  loading = true;
  dashboardOption: GridsterConfig;

  stopAutRefresh: Subject<boolean> = new Subject();

  publicAccess: boolean;

  loadedCardCounting = 0;

  hasEditPermission: boolean;

  timezone: string; //= '0800';
  currentTab: string;

  @ViewChild('dashboard') dashboardEle: ElementRef;

  constructor(
    private orgService: OrganizationService,
    private dashboardService: DashboardService,
    private cardService: CardService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private spinner: LoadingSpinnerSerivce,
    private iamQuery: MeIamQuery,
    private toastr: ToastService,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService
  ) {
    super();
    this.activeIframeService.initListenEvent(APP_IDS.DASHBOARD);
    this.initControls();
  }

  ngOnInit() {
    this.spinner.showSpinner();
    this.dashboardUuid = this.route.snapshot.params['uuid'];
    this.publicAccess = this.route.snapshot.queryParams['mode'] === viewMode.publicAccess;

    forkJoin([this.orgService.getOrganizationByUuid(X.orgUuid), this.dashboardService.getOne(this.dashboardUuid)])
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(([org, dashboard]) => {
        this.timezone = org.utcOffset;
        this.dashboard = dashboard;
      });

    this.iamQuery
      .selectHasGrantedPermission(IAM_SERVICES.dashboard, IAM_DASHBOARD_ACTIONS.manage)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(result => (this.hasEditPermission = result));
  }

  override ngOnDestroy() {
    if (this.stopAutRefresh) {
      this.stopAutRefresh.next(true);
    }
  }

  onEditableChanged(editable: boolean) {
    this.dashboardOption.resizable.enabled = editable;
    this.dashboardOption.draggable.enabled = editable;
    if (this.dashboardOption.api) {
      this.dashboardOption.api.optionsChanged();
    }
  }

  onFilterChanged(settings: DashboardAppDashboardSetting) {
    this.filter = <FilterData>{
      timeRangeKey: settings.timeRange,
      addon: settings.addon
    };

    setTimeout(() => {
      this.calculateTimeRange(settings);
      this.reload();

      if (settings.autoRefresh) {
        this.pollingCards(settings.autoRefreshTime);
      } else {
        this.stopAutRefresh.next(true);
      }
    }, 0);
  }

  addChart() {
    let nextCardConfig = <GridsterItem>{};
    if (this.dashboardOption.api) {
      nextCardConfig = this.dashboardOption.api.getFirstPossiblePosition(nextCardConfig);
    }

    this.dialog
      .open(AddCardComponent, {
        width: '500px',
        data: <AddCardReq>{
          dashboardUuid: this.dashboard.uuid,
          cardConfig: nextCardConfig,
          service: this.dashboard.service
        }
      })
      .afterClosed()
      .subscribe(card => {
        if (card) {
          this.cards.push(card);
        }
      });
  }

  removeCard(card: Card) {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: '400px',
        data: <ConfirmDialogInput>{
          title: 'Remove chart',
          message: `Do you want to remove chart ${card.name} from dashboard?`,
          confirmLabel: 'Remove',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(accepted => {
        if (accepted) {
          this.cardService.delete(card).subscribe(_ => {
            const index = this.cards.findIndex(item => item.uuid === card.uuid);
            this.cards.splice(index, 1);
          });
        }
      });
  }

  itemChange(item: GridsterItem, itemComponent: GridsterItemComponentInterface) {
    if (this.cards) {
      const el = itemComponent.el as HTMLElement;
      const card = this.cards.find(c => c.uuid === el['id']);
      if (card) {
        card.config = item;
        this.cardService.update(card).subscribe(_ => {});
      }
    }
  }

  trackByCard(index: number, card: Card) {
    return card ? card.uuid : null;
  }

  onLoadedCard(card: Card) {
    this.loadedCardCounting++;
    this.loading = this.loadedCardCounting < this.cards.length;
  }

  private reload() {
    this.loading = true;
    this.cardService
      .fetchAll(this.dashboardUuid)
      .pipe(
        finalize(() => {
          if (this.cards.length === 0) {
            this.loading = false;
          }
        })
      )
      .subscribe(
        cards => {
          this.cards = cards;
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }

  private pollingCards(interval: number) {
    timer(interval, interval)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(() => {
          return this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe;
        }),
        mergeMap(() => {
          this.loading = true;
          this.loadedCardCounting = 0;
          return this.cardService.fetchAll(this.dashboardUuid);
        })
      )
      .pipe(
        takeUntil(this.stopAutRefresh),
        catchError(error => {
          setTimeout(() => {
            this.pollingCards(interval);
          }, interval);
          return throwError(error);
        }),
        finalize(() => {
          if (this.cards.length === 0) {
            this.loading = false;
          }
        })
      )
      .subscribe(cards => {
        this.cards = cards;
        if (this.cards.length === 0) {
          this.loading = false;
        }
      });
  }

  private calculateTimeRange(settings: DashboardAppDashboardSetting) {
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(settings.timeRange, this.timezone);
    if (settings.timeRange === TimeRangeKey.specific_date && settings.specificDateRange) {
      timeRange.startDate = format(
        startOfDay(utcToZonedTime(new Date(settings.specificDateRange.startDate), this.timezone)),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        {
          timeZone: this.timezone
        }
      );
      timeRange.endDate = format(
        addDays(startOfDay(utcToZonedTime(new Date(settings.specificDateRange.endDate), this.timezone)), 1),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        {
          timeZone: this.timezone
        }
      );
    }
    this.filter.startTime = timeRange.startDate;
    this.filter.endTime = timeRange.endDate;
  }

  private initControls() {
    this.dashboardOption = {
      gridType: GridType.Fit,
      compactType: CompactType.None,
      margin: 16,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
      outerMarginBottom: null,
      outerMarginLeft: null,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      minCols: 1,
      maxCols: 12,
      minRows: 1,
      maxRows: 100,
      maxItemCols: 12,
      minItemCols: 1,
      maxItemRows: 100,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 1,
      defaultItemRows: 1,
      // fixedColWidth: 105,
      // fixedRowHeight: 105,
      keepFixedHeightInMobile: false,
      keepFixedWidthInMobile: false,
      scrollSensitivity: 10,
      scrollSpeed: 20,
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrop: false,
      enableEmptyCellDrag: false,
      emptyCellDragMaxCols: 50,
      emptyCellDragMaxRows: 50,
      ignoreMarginInRow: false,
      draggable: {
        enabled: false
      },
      resizable: {
        enabled: false
      },
      swap: false,
      pushItems: true,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: false,
      displayGrid: DisplayGrid.None,
      disableWindowResize: false,
      disableWarnings: false, //set tru on prod
      scrollToNewItems: false,
      itemChangeCallback: this.itemChange.bind(this)
    };
  }
}
