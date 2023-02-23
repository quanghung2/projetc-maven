import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { CommunicationAppSettings, PersonalSettingsQuery, PersonalSettingsService } from '@b3networks/api/portal';
import { Agent, AgentService, FindAgentsReq, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import {
  AssignedCallReport,
  AssignedCallReqFilter,
  GetReportV4Payload,
  Period,
  ReportV4Code,
  V4Service
} from '@b3networks/api/data';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, finalize, map, take, takeUntil, tap } from 'rxjs/operators';
import { APP_IDS, DestroySubscriberComponent, downloadData, getFilenameFromHeader, X } from '@b3networks/shared/common';
import { format, utcToZonedTime } from 'date-fns-tz';
import { addDays, isToday, startOfDay } from 'date-fns';
import { FeatureQuery, MeQuery } from '@b3networks/api/license';

@Component({
  selector: 'b3n-assigned-calls',
  templateUrl: './assigned-calls.component.html',
  styleUrls: ['./assigned-calls.component.scss']
})
export class AssignedCallsComponent extends DestroySubscriberComponent implements OnInit {
  settings$: Observable<CommunicationAppSettings>;
  timezone: string;
  queues: QueueInfo[];
  agents: Agent[];
  fetching: boolean;
  pageable: Pageable = { page: 1, perPage: 10 };
  displayedColumns = [
    'tnxUuid',
    'incomingTxnUUID',
    'type',
    'user',
    'queue',
    'from',
    'to',
    'startAt',
    'answerTime',
    'talkDuration',
    'result'
  ];
  ui = {
    paging: new Pageable(1, 10),
    backUpPrevious: <AssignedCallReport[]>null,
    currentAssignedCalls: <AssignedCallReport[]>[],
    backUpNext: <AssignedCallReport[]>null,
    message: 'No data available'
  };

  constructor(
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private profileQuery: IdentityProfileQuery,
    private queueService: QueueService,
    private v4Service: V4Service,
    private toastService: ToastService,
    private agentService: AgentService,
    private featureQuery: FeatureQuery,
    private meLicenseQuery: MeQuery
  ) {
    super();
  }

  get isSupervisor() {
    const profileOrg = this.profileQuery.currentOrg;
    return (
      this.meLicenseQuery.hasCallCenterSupervisorLicense ||
      (this.meLicenseQuery.hasCallCenterEnabledLicense && this.profileQuery.currentOrg.isUpperAdmin) ||
      (profileOrg?.isOwner &&
        (this.featureQuery.hasCallCenterSupervisorLicense || this.featureQuery.hasCallCenterEnabledLicense))
    );
  }

  ngOnInit(): void {
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.timezone = org.utcOffset;
      });
    forkJoin([this.agentService.findAgents(new FindAgentsReq()), this.queueService.loadQueueList()]).subscribe(
      ([agents, queues]) => {
        this.queues = queues;
        this.agents = agents;
        this.settings$ = this.personalSettingQuery.appSettings$.pipe(
          map(apps => {
            let result = <CommunicationAppSettings>(
              apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.COMMUNICATION_HUB)
            );
            result = result || <CommunicationAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.COMMUNICATION_HUB };
            result.assignedCall = result.assignedCall || {
              type: result.assignedCall?.type || 'incoming',
              dateFiltering: {
                startDate: utcToZonedTime(startOfDay(new Date()), this.timezone),
                endDate: utcToZonedTime(startOfDay(new Date()), this.timezone)
              },
              usersFiltering: [],
              resultFiltering: [],
              isLatestDate: true
            };
            if (result.assignedCall.isLatestDate) {
              result.assignedCall.dateFiltering = {
                startDate: utcToZonedTime(startOfDay(new Date()), this.timezone),
                endDate: utcToZonedTime(startOfDay(new Date()), this.timezone)
              };
            }
            return result;
          }),
          tap(settings => {
            this.ui.paging = { ...this.ui.paging, page: 1 };
            this.fetchData(settings);
          })
        );
      }
    );
  }

  updateFilter(settings: CommunicationAppSettings) {
    if (
      [
        settings.assignedCall?.queuesFiltering,
        settings.assignedCall?.usersFiltering,
        settings.assignedCall.resultFiltering
      ].includes('No filtered')
    ) {
      this.ui.currentAssignedCalls = [];
      this.ui.message = 'Please select at least 1 user and 1 queue and 1 result';
      return;
    } else {
      this.ui.message = 'No data available';
    }

    if (isToday(new Date(settings.assignedCall.dateFiltering.startDate))) {
      settings.assignedCall.isLatestDate = true;
    } else {
      settings.assignedCall.isLatestDate = false;
    }
    this.personalSettingService.updateAppSettings(settings).subscribe();
  }

  copy(event: MouseEvent) {
    event.stopPropagation();
    this.toastService.success('Copied to clipboard');
  }

  prevPage(settings) {
    this.fetching = true;
    this.ui.backUpNext = this.ui.currentAssignedCalls;
    this.ui.currentAssignedCalls = this.ui.backUpPrevious;
    this.ui.backUpPrevious = null;
    this.ui.paging.page--;
    this.loadMore(false, settings);
  }

  nextPage(settings) {
    this.fetching = true;
    this.ui.backUpPrevious = this.ui.currentAssignedCalls;
    this.ui.currentAssignedCalls = this.ui.backUpNext;
    this.ui.backUpNext = null;
    this.ui.paging.page++;
    this.loadMore(true, settings);
  }

  export(settings: CommunicationAppSettings) {
    const startTime = settings.assignedCall.dateFiltering.startDate
      ? new Date(settings.assignedCall.dateFiltering.startDate)
      : new Date();
    const endTime = settings.assignedCall.dateFiltering.endDate
      ? new Date(settings.assignedCall.dateFiltering.endDate)
      : new Date();

    const req = <GetReportV4Payload>{
      startTime: format(startOfDay(startTime), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      endTime: format(addDays(startOfDay(endTime), 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      orgUuid: X.orgUuid,
      filter: {
        'callcenter.queueUuid': settings.assignedCall.queuesFiltering || [],
        'callcenter.result': settings.assignedCall.resultFiltering || [],
        'callcenter.queueType': settings.assignedCall.type || 'incoming'
      } as AssignedCallReqFilter
    };
    if (!(settings.assignedCall.usersFiltering?.length === 0)) {
      req.filter['accessors'] = settings.assignedCall.usersFiltering;
    }

    this.v4Service
      .downloadReport2(Period['dump'], ReportV4Code.communication.userAssignedCall, req, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe()
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

  private buildRequest(settings: CommunicationAppSettings) {
    let startDate = startOfDay(utcToZonedTime(new Date(), this.timezone));
    let endDate = startOfDay(utcToZonedTime(new Date(), this.timezone));
    if (!settings.assignedCall.isLatestDate) {
      startDate = startOfDay(
        utcToZonedTime(
          settings.assignedCall.dateFiltering.startDate
            ? new Date(settings.assignedCall.dateFiltering.startDate)
            : new Date(),
          this.timezone
        )
      );
      endDate = startOfDay(
        utcToZonedTime(
          settings.assignedCall.dateFiltering.endDate
            ? new Date(settings.assignedCall.dateFiltering.endDate)
            : new Date(),
          this.timezone
        )
      );
    }
    const req = {
      startTime: format(startDate, "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      endTime: format(addDays(endDate, 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      filter: {
        'callcenter.queueUuid': settings.assignedCall.queuesFiltering || [],
        'callcenter.result': settings.assignedCall.resultFiltering || [],
        'callcenter.queueType': settings.assignedCall.type || 'incoming'
      } as AssignedCallReqFilter
    } as GetReportV4Payload;

    if (!(settings.assignedCall.usersFiltering?.length === 0) || !this.isSupervisor) {
      req.filter['accessors'] = !this.isSupervisor
        ? this.profileQuery.identityUuid
        : settings.assignedCall.usersFiltering;
    }
    return req;
  }

  private fetchData(settings: CommunicationAppSettings) {
    this.fetching = true;

    const next = Object.assign({}, this.ui.paging);
    next.page++;
    const req = this.buildRequest(settings);
    forkJoin([
      this.v4Service
        .getReportData<AssignedCallReport>(
          Period['dump'],
          ReportV4Code.communication.userAssignedCall,
          req,
          this.ui.paging,
          true
        )
        .pipe(map(resp => resp.rows)),
      this.v4Service
        .getReportData<AssignedCallReport>(Period['dump'], ReportV4Code.communication.userAssignedCall, req, next, true)
        .pipe(map(resp => resp.rows))
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.fetching = false))
      )
      .subscribe(([current, backup]: [AssignedCallReport[], AssignedCallReport[]]) => {
        this.ui.currentAssignedCalls = current;
        this.ui.backUpNext = backup;
      });
  }

  private loadMore(isNext: boolean, settings) {
    const handlePage = Object.assign({}, this.ui.paging);
    handlePage.page = isNext ? handlePage.page + 1 : handlePage.page - 1;
    const req = this.buildRequest(settings);
    this.v4Service
      .getReportData(Period['dump'], ReportV4Code.communication.userAssignedCall, req, handlePage, true)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.fetching = false))
      )
      .pipe(
        map(resp => {
          return resp.rows.map(row => row as AssignedCallReport);
        })
      )
      .subscribe(
        histories => {
          if (isNext) {
            this.ui.backUpNext = histories;
          } else {
            this.ui.backUpPrevious = histories;
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
