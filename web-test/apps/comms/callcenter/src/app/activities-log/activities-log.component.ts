import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationService } from '@b3networks/api/auth';
import { Agent, AgentService, FindAgentsReq } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { ActivityLog, GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import {
  CallcenterActivitiesLogSetting,
  CallcenterAppSettings,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import {
  DestroySubscriberComponent,
  downloadData,
  getFilenameFromHeader,
  TimeRangeHelper,
  TimeRangeKey,
  USER_INFO,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
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

  settings$: Observable<CallcenterActivitiesLogSetting>;

  constructor(
    private agentService: AgentService,
    private orgService: OrganizationService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private toastService: ToastService,
    private v4Service: V4Service,
    public dialog: MatDialog
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;

    forkJoin([
      this.agentService.findAgents(new FindAgentsReq()),
      this.orgService.getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid])
    ]).subscribe(
      ([agents, org]) => {
        this.agentList = agents.sort((a, b) => a.displayText.localeCompare(b.displayText));

        this.timezone = org.utcOffset;
        this.timeFormat = org.timeFormat;

        this.settings$ = this.personalSettingQuery.selectAppSettings(X.orgUuid, environment.appId).pipe(
          map(result => {
            result = <CallcenterAppSettings>result;

            result = result || <CallcenterAppSettings>{ orgUuid: X.orgUuid, appId: environment.appId };
            result.activitiesLog =
              result.activitiesLog ||
              <CallcenterActivitiesLogSetting>{
                timeRange: TimeRangeKey.today,
                agent: ''
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

  search(settings: CallcenterActivitiesLogSetting) {
    const appSettings = <CallcenterAppSettings>(this.personalSettingQuery.getAppSettings(
      X.orgUuid,
      environment.appId
    ) || {
      orgUuid: X.orgUuid,
      appId: environment.appId
    });
    appSettings.activitiesLog = settings;
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

  onChangePage(settings: CallcenterActivitiesLogSetting, page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.reload(settings);
  }

  export(settings: CallcenterActivitiesLogSetting) {
    const time = TimeRangeHelper.buildTimeRangeFromKey(settings.timeRange, this.timezone);

    const req = <GetReportV4Payload>{
      startTime: time.startDate,
      endTime: time.endDate,
      filter: {
        agentUuid: !!settings.agent ? settings.agent : null
      }
    };

    this.v4Service
      .downloadReport2(Period.dump, ReportV4Code.callcenter.activity, req, {
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

  private reload(settings: CallcenterActivitiesLogSetting, isRefreshPageable?: boolean) {
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
        .getReportData<ActivityLog>(Period.dump, ReportV4Code.callcenter.activity + '.inapp', req, this.pageable)
        .pipe(map(resp => resp.rows.map(x => new ActivityLog(x)))),
      this.v4Service
        .getReportData<ActivityLog>(
          Period.dump,
          ReportV4Code.callcenter.activity + '.inapp',
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
