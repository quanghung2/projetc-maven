import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Pageable } from '@b3networks/api/common';
import {
  GetReportV4Payload,
  Period,
  RejectReason,
  ReportV4Code,
  SmsHistoryFilter,
  SmsStatus,
  SmsType,
  UnifiedSMSHistory,
  V4Service
} from '@b3networks/api/data';
import {
  DestroySubscriberComponent,
  downloadData,
  getFilenameFromHeader,
  TimeRangeHelper,
  TimeRangeKey,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { format } from 'date-fns-tz';
import { forkJoin } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-sms-history-common',
  templateUrl: './sms-history.component.html',
  styleUrls: ['./sms-history.component.scss']
})
export class SmsHistoryComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns = ['txnUuid', 'type', 'time', 'senderName', 'recipient', 'multipart', 'status', 'metadata'];
  readonly RejectReason: HashMap<string> = RejectReason;
  readonly SmsStatus = SmsStatus;
  loading: boolean;
  timeZone: string;
  loadingDownload: boolean;
  ui = {
    paging: new Pageable(1, 10),
    backUpPrevious: <UnifiedSMSHistory[]>null,
    currentHistories: <UnifiedSMSHistory[]>[],
    backUpNext: <UnifiedSMSHistory[]>null
  };
  selectedHistory: UnifiedSMSHistory | null;

  @Input() noDateRange: boolean;
  @Input() filter: SmsHistoryFilter = {
    timeRange: TimeRangeKey.today,
    startDate: null,
    endDate: null,
    inputSearch: '',
    type: SmsType.all,
    status: SmsStatus.all,
    campaignUuid: null
  };
  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(private toastService: ToastService, private v4Service: V4Service) {
    super();
  }

  ngOnInit(): void {
    this.fetchDataHistories();
  }

  trackTask(index: number, item: UnifiedSMSHistory): string {
    return `${item.txnUuid}`;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  prevPage() {
    this.loading = true;
    this.ui.backUpNext = this.ui.currentHistories;
    this.ui.currentHistories = this.ui.backUpPrevious;
    this.ui.backUpPrevious = null;
    this.ui.paging.page--;
    this.loadMore(false);
    this.closeSidenav();
  }

  nextPage() {
    this.loading = true;
    this.ui.backUpPrevious = this.ui.currentHistories;
    this.ui.currentHistories = this.ui.backUpNext;
    this.ui.backUpNext = null;
    this.ui.paging.page++;
    this.loadMore(true);
    this.closeSidenav();
  }

  onFilterChanged() {
    this.ui.paging.page = 1;
    this.fetchDataHistories();
  }

  downloadCallHistory(type: string) {
    this.loadingDownload = true;
    const req = <GetReportV4Payload>this.buildRequest();
    this.v4Service
      .downloadReport2(Period['dump'], ReportV4Code.unifiedSmsHistoryDownload[type], req, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe(finalize(() => (this.loadingDownload = false)))
      .subscribe(response => {
        downloadData(
          new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
          getFilenameFromHeader(response.headers)
        );
      });
  }

  private fetchDataHistories() {
    const next = Object.assign({}, this.ui.paging);
    next.page++;
    const req = this.buildRequest();
    this.loading = true;

    const api$ = forkJoin([
      this.v4Service
        .getReportData<UnifiedSMSHistory>(Period.dump, ReportV4Code.unifiedHistorySms, req, this.ui.paging, false)
        .pipe(map(res => res.rows.map(x => new UnifiedSMSHistory(x)))),
      this.v4Service
        .getReportData<UnifiedSMSHistory>(Period.dump, ReportV4Code.unifiedHistorySms, req, next, false)
        .pipe(map(res => res.rows.map(x => new UnifiedSMSHistory(x))))
    ]);

    api$
      .pipe(finalize(() => (this.loading = false)))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.ui.currentHistories = res[0];
        this.ui.backUpNext = res[1];
      });
  }

  private loadMore(isNext: boolean) {
    const handlePage = Object.assign({}, this.ui.paging);
    handlePage.page = isNext ? handlePage.page + 1 : handlePage.page - 1;
    if (handlePage.page === 0) {
      this.loading = false;
      return;
    }

    this.v4Service
      .getReportData(Period.dump, ReportV4Code.unifiedHistorySms, this.buildRequest(), handlePage, false)
      .pipe(
        map(res => res.rows.map(x => new UnifiedSMSHistory(x))),
        finalize(() => (this.loading = false))
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

  private buildRequest(): GetReportV4Payload {
    this.filter.startDate?.setSeconds(0);
    this.filter.endDate?.setSeconds(0);

    const req = <GetReportV4Payload>{
      filter: <SmsHistoryFilter>{}
    };
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(this.filter.timeRange, this.timeZone);
    if (this.filter.timeRange === TimeRangeKey.specific_date) {
      timeRange.startDate = format(new Date(this.filter.startDate), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timeZone
      });
      timeRange.endDate = format(
        this.filter.endDate ? new Date(this.filter.endDate) : new Date(),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        {
          timeZone: this.timeZone
        }
      );
    }

    if (this.filter.type && this.filter.type !== SmsType.all) {
      req.filter.type = this.filter.type;
    }

    if (this.filter.status && this.filter.status !== SmsStatus.all) {
      req.filter.status = this.filter.status;
    }

    if (!!this.filter?.campaignUuid) {
      req.filter.campaignUuid = this.filter.campaignUuid;
    }

    req.startTime = timeRange.startDate;
    req.endTime = timeRange.endDate;
    req.sort = [{ time: 'desc' }];
    this.buildParamsWithFilter(req, this.filter);
    return req;
  }

  private buildParamsWithFilter(req: GetReportV4Payload, fil: SmsHistoryFilter) {
    let query = '';
    const and = ' AND ';

    if (!!fil.inputSearch) {
      query += !!query ? and : '';
      query += '("' + fil.inputSearch.trim() + '"' + ' OR ' + '"+' + fil.inputSearch.trim() + '")';
    }

    req.queryString = query ? query : null;
  }

  openMetaData(history: UnifiedSMSHistory, event: MouseEvent) {
    event.stopPropagation();
    this.selectedHistory = history;
    this.sidenav.open();
  }

  closeSidenav() {
    this.selectedHistory = null;
    this.sidenav.close();
  }
}
