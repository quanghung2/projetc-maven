import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TrackByFunction,
  ViewChild
} from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { OrganizationService } from '@b3networks/api/auth';
import {
  Card,
  Dashboard2,
  Dashboard2Card,
  DashboardMap,
  DashboardPermission,
  DashboardV2Service,
  DASHBOARD_2_UUID,
  Template,
  TEMPLATE_SLIDES
} from '@b3networks/api/dashboard';
import {
  DashboardV2AppSetting,
  DashboardV2AppSettingFilter,
  PersonalSettings,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { CompactType, DisplayGrid, GridType } from 'angular-gridster2';
import { firstValueFrom, Subject, Subscription, timer } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-dashboard-detail-v2',
  templateUrl: './dashboard-detail-v2.component.html',
  styleUrls: ['./dashboard-detail-v2.component.scss']
})
export class DashboardDetailV2Component implements OnInit, OnDestroy, OnChanges {
  readonly autoScrollThresholds = [10, 15, 20, 30, 45, 60];
  readonly dashboardOption = {
    gridType: GridType.Fit,
    compactType: CompactType.None,
    margin: 16,
    outerMargin: true,
    outerMarginTop: null,
    outerMarginRight: null,
    outerMarginBottom: null,
    outerMarginLeft: null,
    useTransformPositioning: false,
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
    disableWarnings: false,
    scrollToNewItems: false
  };

  @ViewChild('dashboardContent') dashboardContent: ElementRef;
  @Input() dashboard: Dashboard2;
  @Input() dashboardMap: DashboardMap;
  @Input() grantedManageDashboard: boolean;

  gridsters: Array<Dashboard2Card[]> = [];
  cards: Dashboard2Card[];
  sub = new Subscription();
  afterInitCard: boolean;
  isPopupOpening: boolean;
  activeIndex = 0;
  appSettings: PersonalSettings;
  dashboardV2AppSettings: DashboardV2AppSetting;
  autoScroll: boolean;
  filters: DashboardV2AppSettingFilter;
  slideForward = true;
  afterInitDashboardV2Detail: boolean;
  deviceId: string;
  canManage: boolean;
  showAutoScrollStore: boolean;
  autoScrollThreshold: number;

  destroy$ = new Subject<boolean>();
  destroyRoute$ = new Subject<boolean>();
  destroyAutoScroll$ = new Subject<boolean>();

  constructor(
    private orgService: OrganizationService,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService,
    public dashboardV2Service: DashboardV2Service,
    private personalSettingsService: PersonalSettingsService,
    private personalSettingsQuery: PersonalSettingsQuery,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroyRoute$.next(true);
    this.destroyRoute$.complete();
    this.destroyAutoScroll$.next(true);
    this.destroyAutoScroll$.complete();
  }

  ngOnChanges(_: SimpleChanges) {
    if (!this.afterInitDashboardV2Detail) {
      return;
    }

    this.refreshData();
  }

  async ngOnInit() {
    const params = this.route.snapshot.queryParams;

    if (params['deviceId']) {
      this.deviceId = params['deviceId'];
    }

    await this.orgService.getOrganizationByUuid(X.orgUuid).toPromise();

    this.personalSettingsQuery
      .select()
      .pipe(
        takeUntil(this.destroy$),
        tap(appSettings => {
          this.dashboardV2AppSettings = appSettings.apps.find(
            app => app.appId === DASHBOARD_2_UUID && app.orgUuid === X.orgUuid
          ) as DashboardV2AppSetting;
          this.filters = this.dashboardV2AppSettings?.filters;
          this.autoScroll = !!this.dashboardV2AppSettings?.autoScroll;
          this.autoScrollThreshold = this.dashboardV2AppSettings?.autoScrollThreshold ?? 30;
          this.appSettings = appSettings;

          if (this.autoScroll) {
            this.listenAutoScroll();
          }
        })
      )
      .subscribe();

    this.dashboardV2Service.isPopupOpening$
      .pipe(
        takeUntil(this.destroy$),
        tap(isOpening => {
          this.isPopupOpening = isOpening;
        })
      )
      .subscribe();

    this.dashboardV2Service.isStoreSuccess$
      .pipe(
        takeUntil(this.destroy$),
        filter(res => !!res),
        tap(_ => {
          this.refreshData();
        })
      )
      .subscribe();

    this.refreshData();
    this.afterInitDashboardV2Detail = true;
  }

  refreshData() {
    this.canManage =
      (this.dashboardMap &&
        this.dashboardMap[this.dashboard.uuid] &&
        this.dashboardMap[this.dashboard.uuid][DashboardPermission.MANAGE]) ||
      (this.grantedManageDashboard && !this.dashboardMap);
    this.gridsters = [];
    this.destroyRoute$.next(true);
    this.destroyRoute$.complete();
    this.destroyRoute$ = new Subject<boolean>();
    this.sub.unsubscribe();
    this.sub = new Subscription();
    this.afterInitCard = false;
    this.slideForward = true;
    this.initData();
  }

  initData() {
    this.sub.unsubscribe();
    this.sub = new Subscription();
    this.sub.add(
      timer(0, 10000)
        .pipe(
          takeUntil(this.destroy$),
          filter(() => {
            return (
              this.windownActiveService.windowActiveStatus &&
              this.activeIframeService.isMyIframe &&
              !this.isPopupOpening
            );
          }),
          tap(async () => {
            if (this.deviceId) {
              this.cards = await firstValueFrom(
                this.dashboardV2Service.getPublicCards(this.dashboard.uuid, this.deviceId)
              );
            } else {
              this.cards = await this.dashboardV2Service.getCards(this.dashboard.uuid).toPromise();
            }

            if (!this.afterInitCard) {
              this.afterInitCard = true;
              this.activeIndex = 0;
              this.slideForward = true;
              this.dashboardV2Service.resetDashboardFilterStreams();

              setTimeout(() => {
                this.gridsters = this.renderGridsters(this.cards);
              }, 0);
            } else {
              const gridsters = this.renderGridsters(this.cards);

              this.gridsters.forEach((gridsterCards: any[], i: number) => {
                gridsterCards.forEach((_, j: number) => {
                  this.gridsters[i][j] = gridsters[i][j];
                });
              });
            }
          })
        )
        .subscribe()
    );
  }

  renderGridsters(cards: Dashboard2Card[]): Array<Dashboard2Card[]> {
    const gridsters: Array<Dashboard2Card[]> = [];
    let template: Template;
    let collectionOfCards = [];

    templateLoop: for (let i = 0; i < TEMPLATE_SLIDES.length; i++) {
      const slide = TEMPLATE_SLIDES[i];

      for (let j = 0; j < slide.templates.length; j++) {
        if (slide.templates[j].id === this.dashboard.config.templateId) {
          template = slide.templates[j];
          break templateLoop;
        }
      }
    }

    cards.forEach(card => {
      if (collectionOfCards.length < template.item) {
        collectionOfCards.push(card);
      } else {
        gridsters.push([...collectionOfCards]);
        collectionOfCards = [card];
      }
    });

    if (collectionOfCards.length) {
      gridsters.push([...collectionOfCards]);
    }

    return gridsters;
  }

  trackByCard: TrackByFunction<Card> = (index: number, card: Card) => (card ? card.uuid : null);

  filtersChanged(filters: DashboardV2AppSettingFilter) {
    this.filters = filters;
  }

  listenAutoScroll() {
    timer(this.autoScrollThreshold * 1000, this.autoScrollThreshold * 1000)
      .pipe(
        takeUntil(this.destroyAutoScroll$),
        filter(() => {
          return (
            this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe && !this.isPopupOpening
          );
        }),
        tap(() => {
          if (this.gridsters.length <= 1) {
            return;
          }

          if (this.activeIndex === this.gridsters.length - 1) {
            this.slide(0);
          } else {
            this.slide(this.activeIndex + 1);
          }
        })
      )
      .subscribe();
  }

  autoScrollChanged(checked: boolean) {
    if (checked) {
      this.listenAutoScroll();
    } else {
      this.destroyAutoScroll$.next(true);
      this.destroyAutoScroll$.complete();
      this.destroyAutoScroll$ = new Subject<boolean>();
    }

    this.updateAppSettings();
  }

  slide(index: number) {
    if (index === this.activeIndex) {
      return;
    }

    const dashboardContentDiv = this.dashboardContent.nativeElement as HTMLDivElement;
    const gridsterClasses = dashboardContentDiv.querySelector('gridster').classList;

    gridsterClasses.remove('animate__slideInRight');
    gridsterClasses.remove('animate__slideInLeft');

    if (index > this.activeIndex) {
      this.slideForward = true;
      gridsterClasses.add('animate__slideOutLeft');
    } else {
      this.slideForward = false;
      gridsterClasses.add('animate__slideOutRight');
    }

    setTimeout(() => {
      this.activeIndex = index;
      this.dashboardV2Service.resetDashboardFilterStreams();
    }, 400);
  }

  async updateAppSettings() {
    if (this.dashboardV2Service.isTV$.getValue()) {
      return;
    }

    const dashboardV2AppSetting: DashboardV2AppSetting = {
      appId: DASHBOARD_2_UUID,
      orgUuid: X.orgUuid,
      filters: this.filters,
      autoScroll: this.autoScroll,
      starredUuids: this.dashboardV2AppSettings?.starredUuids,
      autoScrollThreshold: this.autoScrollThreshold
    };

    await firstValueFrom(this.personalSettingsService.updateAppSettings(dashboardV2AppSetting));
  }

  async autoScrollChange(change: MatSelectChange) {
    this.autoScrollThreshold = change.value;

    try {
      await this.updateAppSettings();
      this.toastService.success('Change auto scroll threshold successfully');

      if (this.autoScroll) {
        this.destroyAutoScroll$.next(true);
        this.destroyAutoScroll$.complete();
        this.destroyAutoScroll$ = new Subject<boolean>();
        this.listenAutoScroll();
      }
    } catch (e) {
      this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    }
  }
}
