import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationService } from '@b3networks/api/auth';
import { FeedbackHistoryReq, FeedbackInfo, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { ColumnDef, DumpReq, QueryService } from '@b3networks/api/data';
import {
  CallcenterAppSettings,
  CallcenterWorkspaceFeedbackSetting,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import {
  APP_IDS,
  downloadData,
  TimeRange,
  TimeRangeHelper,
  TimeRangeKey,
  USER_INFO,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { forkJoin, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { FullMessageComponent } from './full-message/full-message.component';

declare var _: any;

@Component({
  selector: 'b3n-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit {
  feedbacks: FeedbackInfo[] = [];

  pageable = <Pageable>{ page: 1, perPage: 10 };
  timezone: string;
  timeFormat: string;
  isMore = false;
  queues: QueueInfo[];
  loading = true;

  settings$: Observable<CallcenterWorkspaceFeedbackSetting>;

  readonly displayedColumns = ['txnUuid', 'customerNumber', 'receivedTime', 'queueName', 'rating', 'message', 'agent'];

  constructor(
    private orgService: OrganizationService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private queryService: QueryService,
    private queueService: QueueService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService
  ) {}

  ngOnInit() {
    forkJoin([
      this.orgService.getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid]),
      this.queueService.getQueuesFromCache()
    ]).subscribe(([org, queues]) => {
      this.timezone = org.utcOffset;
      this.timeFormat = org.timeFormat;
      this.queues = _.orderBy(queues, [(q: QueueInfo) => q.label.toLowerCase()], ['asc']);

      this.settings$ = this.personalSettingQuery.selectAppSettings(X.orgUuid, APP_IDS.WALLBOARD).pipe(
        map(result => {
          result = <CallcenterAppSettings>result;

          result = result || <CallcenterAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.WALLBOARD };
          result.workspaceFeedback =
            result.workspaceFeedback ||
            <CallcenterWorkspaceFeedbackSetting>{
              timeRange: TimeRangeKey.today
            };

          return result.workspaceFeedback;
        }),
        tap(settings => {
          this.fetchData(settings);
        })
      );
    });
  }

  onFilterChanged(filter: CallcenterWorkspaceFeedbackSetting) {
    const appSettings = <CallcenterAppSettings>(this.personalSettingQuery.getAppSettings(
      X.orgUuid,
      APP_IDS.WALLBOARD
    ) || {
      orgUuid: X.orgUuid,
      appId: APP_IDS.WALLBOARD
    });
    appSettings.workspaceFeedback = filter;
    this.personalSettingService.updateAppSettings(appSettings).subscribe();
  }

  onChangePage(filter: CallcenterWorkspaceFeedbackSetting, page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.onFilterChanged(filter);
  }

  buildTimeRange(filter: CallcenterWorkspaceFeedbackSetting): TimeRange {
    const startDate = format(
      startOfDay(utcToZonedTime(new Date(filter.startDate), this.timezone)),
      "yyyy-MM-dd'T'HH:mm:ssxxx",
      {
        timeZone: this.timezone
      }
    );
    const endDate = format(
      addDays(startOfDay(utcToZonedTime(new Date(filter.endDate), this.timezone)), 1),
      "yyyy-MM-dd'T'HH:mm:ssxxx",
      {
        timeZone: this.timezone
      }
    );
    return { startDate: startDate, endDate: endDate } as TimeRange;
  }

  export(filter: CallcenterWorkspaceFeedbackSetting) {
    const timeRange =
      filter.timeRange === TimeRangeKey.specific_date
        ? this.buildTimeRange(filter)
        : TimeRangeHelper.buildTimeRangeFromKey(filter.timeRange, this.timezone);

    const req: DumpReq = new DumpReq({
      filename: `feedback_{range}.csv`,
      startTime: timeRange.startDate,
      endTime: timeRange.endDate,
      zoneOffset: this.timezone,
      dateTimeFormat: this.timeFormat,
      columnDefs: this.createColumnDefs()
    });

    this.queryService.dump2CsvForFeedbacks(req).subscribe((resp: any) => {
      const blob = new Blob([resp.body], { type: 'application/octet-stream' });
      const contentDisposition = resp.headers.get('content-disposition') || '';
      const matches = /filename=([^;]+)/gi.exec(contentDisposition);
      const fileName = (matches[1] || 'untitled').trim();
      downloadData(blob, fileName);
    });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  openFullMessage(msg: string) {
    this.dialog.open(FullMessageComponent, {
      data: msg,
      minHeight: '30vh',
      minWidth: '50vw'
    });
  }

  private fetchData(filter: CallcenterWorkspaceFeedbackSetting) {
    this.loading = true;
    const req = this.buildHistoryFeedbackReq(filter);
    forkJoin([
      this.queryService.searchFeedbackHistory(req, this.pageable),
      this.queryService.searchFeedbackHistory(req, <Pageable>{
        page: this.pageable.page + 1,
        perPage: this.pageable.perPage
      })
    ])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((data: any) => {
        this.feedbacks = [];
        data[0].map(feedback => {
          this.feedbacks.push(new FeedbackInfo(feedback));
        });
        this.isMore = data[1].length > 0 ? true : false;
      });
  }

  private buildHistoryFeedbackReq(filter: CallcenterWorkspaceFeedbackSetting) {
    let req: FeedbackHistoryReq;
    if (filter.timeRange === TimeRangeKey.specific_date) {
      req = {
        startTime: format(
          startOfDay(utcToZonedTime(new Date(filter.startDate), this.timezone)),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: this.timezone
          }
        ),
        endTime: format(
          addDays(startOfDay(utcToZonedTime(new Date(filter?.endDate || filter.startDate), this.timezone)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: this.timezone
          }
        )
      } as FeedbackHistoryReq;
    } else {
      const timeRangeFromHelper = TimeRangeHelper.buildTimeRangeFromKey(filter.timeRange, this.timezone);
      req = {
        startTime: timeRangeFromHelper.startDate,
        endTime: timeRangeFromHelper.endDate
      } as FeedbackHistoryReq;
    }

    if (filter.customerNumber) {
      req.customerNumber = filter.customerNumber;
    }
    if (filter.filterByQueue) {
      req.queueUuid = filter.filterByQueue;
    }

    return req;
  }

  private createColumnDefs(): ColumnDef[] {
    return [
      new ColumnDef('Txn. Uuid', '$.txnUuid'),
      new ColumnDef('Customer number', '$.customerNumber'),
      new ColumnDef('Received Time', '$.receivedTime', 'string', `datetime:${this.timeFormat}`),
      new ColumnDef('Rating', '$.feedbackRate', 'number'),
      new ColumnDef('Message', '$.feedbackMessage'),
      new ColumnDef('`Queue', '$.queueName'),
      new ColumnDef('Agent', '', 'formula', 'default', '', "$.extensionLabel+' (#'+$.extensionKey+')'")
    ];
  }
}
