import { KeyValue } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Dashboard, FilterType } from '@b3networks/api/dashboard';
import {
  DashboardAppDashboardSetting,
  DashboardAppSetting,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import { TimeRangeKey, X } from '@b3networks/shared/common';
import { arrayAdd, arrayUpdate } from '@datorama/akita';
import { subDays } from 'date-fns';
import { forkJoin, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

export interface AutoRefreshData {
  autoRefresh: boolean;
  interval: number;
}

@Component({
  selector: 'b3n-dashboard-detail-toolbar',
  templateUrl: './dashboard-detail-toolbar.component.html',
  styleUrls: ['./dashboard-detail-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDetailToolbarComponent implements OnInit, OnChanges {
  readonly FilterType = FilterType;

  readonly refreshIntervals: KeyValue<number, string>[] = [
    { key: 10 * 1000, value: 'Every 10 seconds' },
    { key: 30 * 1000, value: 'Every 30 seconds' },
    { key: 60 * 1000, value: 'Every 1 minute' },
    { key: 5 * 60 * 1000, value: 'Every 5 minutes' }
  ];

  readonly timeRanges = [
    { key: TimeRangeKey['15m'], value: 'Last 15 minutes' },
    { key: TimeRangeKey['30m'], value: 'Last 30 minutes' },
    { key: TimeRangeKey['1h'], value: 'Last 1 hour' },
    { key: TimeRangeKey['4h'], value: 'Last 4 hours' },
    { key: TimeRangeKey['12h'], value: 'Last 12 hours' },
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.last60days, value: 'Last 60 days' },
    { key: TimeRangeKey.last90days, value: 'Last 90 days' },
    { key: TimeRangeKey.specific_date, value: 'Specific Date' }
  ];

  addonFilterDatas: KeyValue<string, KeyValue<any, any>[]> = <KeyValue<string, any>>{};

  editing: boolean;

  maxDate: Date = new Date();
  minDate: Date = subDays(new Date(), 99);

  settings: DashboardAppDashboardSetting;
  settings$: Observable<DashboardAppDashboardSetting>;

  timeRangeForm = new UntypedFormGroup({
    startDate: new UntypedFormControl(),
    endDate: new UntypedFormControl()
  });

  @Input() loading: boolean;
  @Input() publicAccess: boolean;
  @Input() dashboard: Dashboard;
  @Input() hasEditPermission: boolean;

  @Output() editableChanged = new EventEmitter<boolean>();
  @Output() addChartChanged = new EventEmitter<boolean>();
  @Output() settingChanged = new EventEmitter<DashboardAppDashboardSetting>();

  constructor(
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private http: HttpClient,
    @Inject('APP_ID') private appId: string
  ) {}

  ngOnInit() {
    this.timeRangeForm.valueChanges.pipe(filter(value => value.startDate && value.endDate)).subscribe(value => {
      console.log(value);

      this.settings.specificDateRange = value;
      this.updateSettings(this.settings);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dashboard'] && this.dashboard) {
      if (this.dashboard.config && this.dashboard.config.filters) {
        const requests$ = this.dashboard.config.filters.map(fil => {
          return this.http
            .request(fil.request.method, fil.request.path, {
              params: fil.request.params
            })
            .pipe(
              map(resp => {
                let result: KeyValue<string, any>[];
                if (resp instanceof Array) {
                  result = resp.map(item => {
                    return <KeyValue<string, any>>{ key: item[fil.mapping.key], value: item[fil.mapping.value] };
                  });
                }

                if (!this.addonFilterDatas) {
                  this.addonFilterDatas = <KeyValue<string, any>>{};
                }

                this.addonFilterDatas.key = fil.id;
                this.addonFilterDatas.value = result;
                return result;
              })
            );
        });

        forkJoin(requests$).subscribe();
      }

      this.settings$ = this.personalSettingQuery.selectAppSettings(X.orgUuid, this.appId).pipe(
        map(result => {
          result = <DashboardAppSetting>result;

          result =
            result ||
            <DashboardAppSetting>{
              orgUuid: X.orgUuid,
              appId: this.appId,
              dashboards: []
            };
          result.dashboards = result.dashboards || [];
          const index = result.dashboards.findIndex(d => d.id === this.dashboard.uuid);
          if (index === -1) {
            result.dashboards = arrayAdd(result.dashboards, <DashboardAppDashboardSetting>{
              id: this.dashboard.uuid,
              timeRange: this.timeRanges[5].key,
              autoRefresh: false,
              autoRefreshTime: this.refreshIntervals[3].key,
              addon: {}
            });
          }

          return result.dashboards.find(d => d.id === this.dashboard.uuid);
        }),
        filter(settings => settings != null),
        tap(settings => {
          this.settings = settings;
          if (
            settings.timeRange === TimeRangeKey.specific_date &&
            settings.specificDateRange &&
            (!this.timeRangeForm.get('startDate').value || !this.timeRangeForm.get('endDate').value)
          ) {
            this.timeRangeForm.get('startDate').setValue(settings.specificDateRange.startDate);
            this.timeRangeForm.get('endDate').setValue(settings.specificDateRange.endDate);
          } else {
            this.settingChanged.emit(settings);
          }
        })
      );
    }
  }

  timeRangeChanged(settings: DashboardAppDashboardSetting, isSpecificDateChanged: boolean = false) {
    if (settings.timeRange !== TimeRangeKey.specific_date || isSpecificDateChanged) {
      this.updateSettings(settings);
    }
  }

  compareCodeFn(a: string, b: string) {
    return a && b && a === b;
  }

  toggleEditable() {
    this.editing = !this.editing;
    this.editableChanged.emit(this.editing);
  }

  toggleAutoRefresh(settings: DashboardAppDashboardSetting) {
    settings.autoRefresh = !settings.autoRefresh;
    this.updateSettings(settings);
  }

  addChart() {
    this.addChartChanged.emit(true);
  }

  async onSettingChange(settings: DashboardAppDashboardSetting) {
    this.updateSettings(settings);
  }

  private updateSettings(settings: DashboardAppDashboardSetting) {
    const appSettings = <DashboardAppSetting>(this.personalSettingQuery.getAppSettings(X.orgUuid, this.appId) || {
      orgUuid: X.orgUuid,
      appId: this.appId,
      dashboards: []
    });

    const index = appSettings.dashboards.findIndex(d => d.id === settings.id);
    if (index === -1) {
      appSettings.dashboards = arrayAdd(appSettings.dashboards, settings);
    } else {
      appSettings.dashboards = arrayUpdate(appSettings.dashboards, settings.id, settings);
    }

    this.personalSettingService.updateAppSettings(appSettings).subscribe();
  }
}
