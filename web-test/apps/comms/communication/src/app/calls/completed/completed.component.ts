import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { CompletedCallReport, GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { CommunicationAppSettings, PersonalSettingsQuery, PersonalSettingsService } from '@b3networks/api/portal';
import { APP_IDS, DestroySubscriberComponent, downloadData, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, isToday, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { forkJoin, Observable } from 'rxjs';
import { filter, finalize, map, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-completed',
  templateUrl: './completed.component.html',
  styleUrls: ['./completed.component.scss']
})
export class CompletedComponent extends DestroySubscriberComponent implements OnInit {
  settings$: Observable<CommunicationAppSettings>;
  timezone: string;
  queues: QueueInfo[];
  fetching: boolean;
  pageable: Pageable = { page: 1, perPage: 10 };
  displayedColumns = [
    'tnxUuid',
    'user',
    'queue',
    'caller',
    'startAt',
    'answerTime',
    'talkDuration',
    'acwDuration',
    'result'
  ];
  ui = {
    paging: new Pageable(1, 10),
    backUpPrevious: <CompletedCallReport[]>null,
    currentCompletedCalls: <CompletedCallReport[]>[],
    backUpNext: <CompletedCallReport[]>null,
    message: 'No data available'
  };

  constructor(
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private profileQuery: IdentityProfileQuery,
    private queueService: QueueService,
    private v4Service: V4Service,
    private toastService: ToastService
  ) {
    super();
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

    this.queueService.loadQueueList().subscribe(queues => {
      this.queues = queues;
      this.settings$ = this.personalSettingQuery.appSettings$.pipe(
        map(apps => {
          let result = <CommunicationAppSettings>(
            apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.COMMUNICATION_HUB)
          );
          result = result || <CommunicationAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.COMMUNICATION_HUB };
          result.completedCall = result.completedCall || {
            type: result.completedCall?.type || 'incoming',
            dateFiltering: {
              startDate: utcToZonedTime(startOfDay(new Date()), this.timezone),
              endDate: utcToZonedTime(startOfDay(new Date()), this.timezone)
            },
            usersFiltering: [],
            resultFiltering: [],
            isLatestDate: true
          };
          if (result.completedCall.isLatestDate) {
            result.completedCall.dateFiltering = {
              startDate: utcToZonedTime(startOfDay(new Date()), this.timezone),
              endDate: utcToZonedTime(startOfDay(new Date()), this.timezone)
            };
          }
          return result;
        }),
        tap(settings => {
          this.ui.paging = { ...this.ui.paging, page: 1 };
          this.updateDislayedColumn(settings);
          this.fetchData(settings);
        })
      );
    });
  }

  updateDislayedColumn(settings: CommunicationAppSettings) {
    if (settings.completedCall?.type === 'callback') {
      this.displayedColumns = [
        'tnxUuid',
        'incomingTxnUUID',
        'user',
        'queue',
        'caller',
        'callbackNumber',
        'startAt',
        'answerTime',
        'talkDuration',
        'result'
      ];
    } else {
      this.displayedColumns = [
        'tnxUuid',
        'user',
        'queue',
        'caller',
        'startAt',
        'answerTime',
        'talkDuration',
        'acwDuration',
        'result'
      ];
    }
  }

  updateFilter(settings: CommunicationAppSettings) {
    if (
      [
        settings.completedCall?.queuesFiltering,
        settings.completedCall?.usersFiltering,
        settings.completedCall.resultFiltering
      ].includes('No filtered')
    ) {
      this.ui.currentCompletedCalls = [];
      this.ui.message = 'Please select at least 1 user and 1 queue and 1 result';
      return;
    } else {
      this.ui.message = 'No data available';
    }

    if (isToday(new Date(settings.completedCall.dateFiltering.startDate))) {
      settings.completedCall.isLatestDate = true;
    } else {
      settings.completedCall.isLatestDate = false;
    }
    this.personalSettingService.updateAppSettings(settings).subscribe();
  }

  copy(event: MouseEvent) {
    event.stopPropagation();
    this.toastService.success('Copied to clipboard');
  }

  prevPage(settings) {
    this.fetching = true;
    this.ui.backUpNext = this.ui.currentCompletedCalls;
    this.ui.currentCompletedCalls = this.ui.backUpPrevious;
    this.ui.backUpPrevious = null;
    this.ui.paging.page--;
    this.loadMore(false, settings);
  }

  nextPage(settings) {
    this.fetching = true;
    this.ui.backUpPrevious = this.ui.currentCompletedCalls;
    this.ui.currentCompletedCalls = this.ui.backUpNext;
    this.ui.backUpNext = null;
    this.ui.paging.page++;
    this.loadMore(true, settings);
  }

  export(settings: CommunicationAppSettings) {
    const startTime = settings.completedCall.dateFiltering.startDate
      ? new Date(settings.completedCall.dateFiltering.startDate)
      : new Date();
    const endTime = settings.completedCall.dateFiltering.endDate
      ? new Date(settings.completedCall.dateFiltering.endDate)
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
        queueUuid: settings.completedCall?.queuesFiltering || [],
        result3: settings.completedCall?.resultFiltering || []
      }
    };
    if (!(settings.completedCall.usersFiltering?.length === 0)) {
      req.filter['agentUuid'] = settings.completedCall.usersFiltering;
    }
    this.v4Service
      .getReportData(Period['dump'], this.getReportCode(settings), req, null, true)
      .pipe()
      .subscribe(response => {
        const replacer = (key, value) => (value === null ? '' : value);
        const fileName = response['filename'] || `${response['label']}.csv`;

        const header = response.columnOrder;
        const dataExport = response['rows'];

        if (dataExport.length > 0) {
          const csvListItem = dataExport.map(row =>
            header.map(fieldName => JSON.stringify(row[fieldName], replacer).replace(/\\"/g, '"')).join(',')
          );
          csvListItem.unshift(header.join(','));
          const csvData = csvListItem.join('\r\n');
          const blob = new Blob(['\ufeff', csvData]);

          downloadData(blob, fileName);
          this.toastService.success('Export successfully');
        } else {
          this.toastService.error('Nothing to export');
        }
      });
  }

  private getReportCode(settings: CommunicationAppSettings) {
    return settings.completedCall.type === 'callback'
      ? ReportV4Code.communication.callbackEnded
      : ReportV4Code.communication.inboundEnded;
  }

  private buildRequest(settings: CommunicationAppSettings) {
    let startDate = startOfDay(utcToZonedTime(new Date(), this.timezone));
    let endDate = startOfDay(utcToZonedTime(new Date(), this.timezone));
    if (!settings.completedCall.isLatestDate) {
      startDate = startOfDay(
        utcToZonedTime(
          settings.completedCall.dateFiltering.startDate
            ? new Date(settings.completedCall.dateFiltering.startDate)
            : new Date(),
          this.timezone
        )
      );
      endDate = startOfDay(
        utcToZonedTime(
          settings.completedCall.dateFiltering.endDate
            ? new Date(settings.completedCall.dateFiltering.endDate)
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
        queueUuid: settings.completedCall.queuesFiltering,
        result3: settings.completedCall.resultFiltering
      }
    } as GetReportV4Payload;

    if (!(settings.completedCall.usersFiltering?.length === 0)) {
      req.filter['agentUuid'] = settings.completedCall.usersFiltering;
    }
    return req;
  }

  private fetchData(settings: CommunicationAppSettings) {
    this.fetching = true;

    const next = Object.assign({}, this.ui.paging);
    next.page++;
    const reportCode = this.getReportCode(settings);
    const req = this.buildRequest(settings);
    forkJoin([
      this.v4Service
        .getReportData<CompletedCallReport>(Period['dump'], reportCode, req, this.ui.paging, true)
        .pipe(map(resp => resp.rows)),
      this.v4Service
        .getReportData<CompletedCallReport>(Period['dump'], reportCode, req, next, true)
        .pipe(map(resp => resp.rows))
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.fetching = false))
      )
      .subscribe(([current, backup]: [CompletedCallReport[], CompletedCallReport[]]) => {
        this.ui.currentCompletedCalls = current;
        this.ui.backUpNext = backup;
      });
  }

  private loadMore(isNext: boolean, settings) {
    const handlePage = Object.assign({}, this.ui.paging);
    handlePage.page = isNext ? handlePage.page + 1 : handlePage.page - 1;
    const reportCode = this.getReportCode(settings);
    const req = this.buildRequest(settings);
    this.v4Service
      .getReportData(Period['dump'], reportCode, req, handlePage, true)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.fetching = false))
      )
      .pipe(
        map(resp => {
          return resp.rows.map(row => row as CompletedCallReport);
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
