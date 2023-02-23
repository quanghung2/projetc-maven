import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery, OrganizationService } from '@b3networks/api/auth';
import { Agent, AgentService, FindAgentsReq } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { ActivityLog, GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { MeQuery } from '@b3networks/api/license';
import {
  CommunicationActivitiesLogSetting,
  CommunicationAppSettings,
  PersonalSettingsQuery,
  PersonalSettingsService,
  UserMenu
} from '@b3networks/api/portal';
import {
  APP_IDS,
  DestroySubscriberComponent,
  downloadData,
  getFilenameFromHeader,
  TimeRangeHelper,
  TimeRangeKey,
  USER_INFO,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { finalize, map, take, takeUntil, tap } from 'rxjs/operators';
import { RemarksDialogComponent } from './remarks/remarks-dialog.component';

@Component({
  selector: 'b3n-activities-log',
  templateUrl: './activities-log.component.html',
  styleUrls: ['./activities-log.component.scss']
})
export class ActivitiesLogComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns: string[] = ['agent', 'status', 'remark', 'from', 'to', 'duration', 'updatedBy'];

  readonly timeRanges = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.last60days, value: 'Last 60 days' },
    { key: TimeRangeKey.last90days, value: 'Last 90 days' }
  ];

  agentList: Agent[] = [];
  timezone: string;
  timeFormat: string;
  logs: ActivityLog[] = [];
  hasMore: boolean;
  isMore: boolean;
  loading: boolean;

  pageable: Pageable = new Pageable(1, 10);

  settings$: Observable<CommunicationActivitiesLogSetting>;
  hasCallCenterSupervisorLicense$: Observable<boolean>;
  hasCallCenterEnabledLicense$: Observable<boolean>;
  isUpperAdmin: boolean;

  constructor(
    private agentService: AgentService,
    private orgService: OrganizationService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private toastService: ToastService,
    private v4Service: V4Service,
    public dialog: MatDialog,
    private meLicenseQuery: MeQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    this.hasCallCenterSupervisorLicense$ = this.meLicenseQuery.hasCallCenterSupervisorLicense$;
    this.hasCallCenterEnabledLicense$ = this.meLicenseQuery.hasCallCenterEnabledLicense$;
    this.isUpperAdmin = this.profileQuery.currentOrg.isUpperAdmin;

    this.profileQuery.profile$.pipe(take(1), takeUntil(this.destroySubscriber$)).subscribe(profile => {
      this.meLicenseQuery.hasCallCenterSupervisorLicense$
        .pipe(take(1), takeUntil(this.destroySubscriber$))
        .subscribe(isSuperviser => {
          if (!isSuperviser) {
            const setting = <CommunicationAppSettings>(
              this.personalSettingQuery.getAppSettings(X.orgUuid, APP_IDS.COMMUNICATION_HUB)
            );
            this.search(<CommunicationActivitiesLogSetting>{
              ...setting.activitiesLog,
              agent: profile.uuid
            });
          }
        });
    });

    combineLatest([
      this.agentService.findAgents(new FindAgentsReq()),
      this.orgService.getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid])
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        ([agents, org]) => {
          this.agentList = agents.sort((a, b) => a.displayText.localeCompare(b.displayText));

          this.timezone = org.utcOffset;
          this.timeFormat = org.timeFormat;

          this.settings$ = this.personalSettingQuery.selectAppSettings(X.orgUuid, APP_IDS.COMMUNICATION_HUB).pipe(
            map(result => {
              result = <CommunicationAppSettings>result;

              result = result || <CommunicationAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.COMMUNICATION_HUB };
              const initSettings = <CommunicationActivitiesLogSetting>{
                timeRange: TimeRangeKey.today,
                agent: ''
              };
              result.activitiesLog = {
                ...initSettings,
                ...result.activitiesLog
              };

              return result.activitiesLog;
            }),
            tap(settings => {
              this.reload(settings, true);
            })
          );
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  search(settings: CommunicationActivitiesLogSetting) {
    const appSettings = <CommunicationAppSettings>(this.personalSettingQuery.getAppSettings(
      X.orgUuid,
      APP_IDS.COMMUNICATION_HUB
    ) || {
      orgUuid: X.orgUuid,
      appId: APP_IDS.COMMUNICATION_HUB
    });
    appSettings.activitiesLog = settings;
    appSettings.users = UserMenu.activity_log;
    this.personalSettingService.updateAppSettings(appSettings).subscribe();
  }

  openRemarksDialog() {
    this.dialog.open(RemarksDialogComponent, {
      minWidth: '350px',
      data: {}
    });
  }

  compareCodeFn(a: string, b: string) {
    return a && b && a === b;
  }

  onChangePage(settings: CommunicationActivitiesLogSetting, page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.reload(settings);
  }

  export(settings: CommunicationActivitiesLogSetting) {
    const time = TimeRangeHelper.buildTimeRangeFromKey(settings.timeRange, this.timezone);

    const req = <GetReportV4Payload>{
      startTime: time.startDate,
      endTime: time.endDate,
      filter: {
        agentUuid: !!settings.agent ? settings.agent : null
      }
    };

    this.v4Service
      .downloadReport2(Period.dump, ReportV4Code.communication.activity + '.inapp', req, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .subscribe(
        response => {
          downloadData(
            new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
            getFilenameFromHeader(response.headers)
          );
        },
        error => {
          this.toastService.error(error.message || 'Cannot download report. Please try again later.');
        }
      );
  }

  private reload(settings: CommunicationActivitiesLogSetting, isRefreshPageable?: boolean) {
    if (isRefreshPageable) {
      this.pageable.page = 1;
    }
    const time = TimeRangeHelper.buildTimeRangeFromKey(settings.timeRange, this.timezone);

    const req = <GetReportV4Payload>{
      startTime: time.startDate,
      endTime: time.endDate,
      filter: {
        agentUuid: !!settings.agent ? settings.agent : null
      }
    };
    this.loading = true;
    forkJoin([
      this.v4Service
        .getReportData<ActivityLog>(
          Period.dump,
          ReportV4Code.communication.activity + '.inapp',
          req,
          this.pageable,
          true
        )
        .pipe(map(resp => resp.rows.map(x => new ActivityLog(x)))),
      this.v4Service
        .getReportData<ActivityLog>(
          Period.dump,
          ReportV4Code.communication.activity + '.inapp',
          req,
          new Pageable(this.pageable.page + 1, this.pageable.perPage)
        )
        .pipe(
          map(resp => resp.rows.map(x => new ActivityLog(x))),
          finalize(() => (this.loading = false))
        )
    ]).subscribe(
      data => {
        this.isMore = data[1].length > 0;
        this.logs = data[0];
      },
      err => {
        if (err.code === 'data.notFound') {
          this.logs = [];
          this.hasMore = false;
        } else {
          this.toastService.error(err.message);
        }
      }
    );
  }
}
