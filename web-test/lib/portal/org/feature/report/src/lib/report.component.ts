import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IAM_BILLING_ACTIONS, IAM_SERVICES, MeIamService, OrganizationService } from '@b3networks/api/auth';
import { GetReportV4Payload, Period, Report, ReportReq, ReportService, V4Service } from '@b3networks/api/data';
import { downloadData, getFilenameFromHeader, USER_INFO, X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  differenceInDays,
  differenceInMinutes,
  min,
  startOfDay,
  startOfMonth,
  subDays
} from 'date-fns';
import { format } from 'date-fns-tz';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

const MAX_DATA_POINTS = 100;
const FIFTEEN_MINUTES_INTERVAL = MAX_DATA_POINTS * 15;
const THIRTY_MINUTES_INTERVAL = MAX_DATA_POINTS * 30;
const ONE_HOUR_INTERVAL = MAX_DATA_POINTS * 60;
const ONE_DAY_INTERVAL = MAX_DATA_POINTS * 60 * 24;
const ONE_MONTH_INTERVAL = ONE_DAY_INTERVAL * 30;

@Component({
  selector: 'por-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  readonly Period = Period;
  intervalOptions: KeyValue<Period, string>[] = [
    { key: Period['15m'], value: '15 minutes' },
    { key: Period['30m'], value: '30 minutes' },
    { key: Period['1h'], value: '1 hour' },
    { key: Period['1d'], value: '1 day' },
    { key: Period['1M'], value: '1 month' }
  ];

  userUtcOffset: string;
  orgUuid = X.getContext()['orgUuid'];
  code: Report;
  codes: Report[] = [];

  startTime: Date;
  minStart = new Date();
  maxStart = new Date();

  endTime: Date;
  minEnd = new Date();
  maxEnd = new Date();

  datePickerType: 'datetime' | 'date' | 'month' = 'datetime';

  clockStep = 1;
  showReport: boolean;
  dynamicInterval: Period;

  progressing: boolean;

  startAt = startOfDay(new Date());
  selectedInterval = this.intervalOptions[0].key;
  backupData: KeyValue<Period, string>[] = [];
  isSingleTimer: Period;

  constructor(
    private reportService: ReportService,
    private spinnerService: LoadingSpinnerSerivce,
    private orgService: OrganizationService,
    public dialog: MatDialog,
    public router: Router,
    private iamService: MeIamService,
    private toastService: ToastService,
    private v4Service: V4Service
  ) {}

  get hasAnalyticsReport(): boolean {
    const report = this.codes.find(code => {
      return (code.type && code.type !== 'dump') || (code.period && code.period !== 'dump');
    });
    return report ? true : false;
  }

  get hasHistoryReport(): boolean {
    const report = this.codes.find(code => {
      return code.period === 'dump' || code.type === 'dump';
    });
    return report ? true : false;
  }

  get toggleLabel(): string {
    return this.selectedInterval === Period['1h']
      ? 'Select 1 hour'
      : this.selectedInterval === Period['1d']
      ? 'Select 1 day'
      : this.selectedInterval === Period['1M']
      ? 'Select 1 month'
      : '';
  }

  get selectedSingleTimer() {
    return this.hasAnalyticsReport &&
      this.isSingleTimer &&
      [Period['1h'], Period['1d'], Period['1M']].includes(this.selectedInterval)
      ? this.selectedInterval
      : null;
  }

  ngOnInit() {
    this.verifyAndFetchReports();
    this.backupData = this.intervalOptions;
  }

  reportChanged() {
    this.startTime = null;
    this.endTime = null;
    this.limitedIntervalOptions();
    this.updateDatePickerType();
    this.updateClockStep();

    if (this.code && this.code.period === Period['1M']) {
      const day = new Date().getDay();
      const year = new Date().getFullYear();
      const lastMonth = new Date().getMonth() - 1;
      this.maxStart = startOfMonth(new Date(year, lastMonth, day));
    } else {
      this.maxStart = new Date();
    }

    if (this.code.supportsV4) {
      this.limitedTimeRangePossible();
      return;
    }

    if (this.code.period === Period['15m']) {
      this.datePickerType = 'datetime';
      this.clockStep = 15;
      this.minStart = subDays(new Date(), 100);
    } else if (this.code.period === Period['30m']) {
      this.datePickerType = 'datetime';
      this.clockStep = 30;
      this.minStart = subDays(new Date(), 100);
    } else if (this.code.period === Period['1h']) {
      this.datePickerType = 'datetime';
      this.clockStep = 60;
      this.minStart = subDays(new Date(), 100);
    } else if (this.code.period === Period['1d']) {
      this.datePickerType = 'date';
      this.minStart = subDays(new Date(), 365);
    } else if (this.code.period === Period.dump) {
      this.datePickerType = 'datetime';
      this.clockStep = 1;
      this.minStart = subDays(new Date(), 365);
    }
  }

  startTimeChanged() {
    this.endTime = null;
    if (this.code.supportsV4) {
      this.limitedTimeRangePossible();
      return;
    }

    this.minEnd = subDays(this.startTime, 1);
    switch (this.code.period) {
      case Period['15m']: {
        this.maxEnd = min([new Date(), addDays(this.startTime, 1)]);
        break;
      }
      case Period['30m']: {
        this.maxEnd = min([new Date(), addDays(this.startTime, 1)]);
        break;
      }
      case Period['1h']: {
        this.maxEnd = min([new Date(), addDays(this.startTime, 7)]);
        break;
      }
      case Period['1d']: {
        this.maxEnd = min([new Date(), addDays(this.startTime, 100)]);
        break;
      }
      case Period.dump: {
        this.maxEnd = min([new Date(), addDays(this.startTime, 100)]);
        break;
      }
    }
  }

  limitedIntervalOptions() {
    const hasNoSpecificPeriod = this.code && this.code.period === Period['*'];
    this.selectedInterval = hasNoSpecificPeriod ? Period['15m'] : this.code?.period;
    this.intervalOptions = hasNoSpecificPeriod
      ? this.backupData
      : this.backupData.filter(item => item.key === this.selectedInterval);
  }

  download() {
    if (!this.code && !this.startTime && !this.endTime) {
      this.toastService.error('Please fill all inputs');
      return;
    }
    if (differenceInDays(this.endTime, this.startTime) > 100 && this.selectedInterval !== Period['1M']) {
      this.toastService.error('Duration cannot over 100 days');
      return;
    }

    if (this.code.supportsV4) {
      this.downloadReportV4();
      return;
    }

    const req = new ReportReq();
    req.code = this.code;

    req.startTime = format(this.getStartTimeReq(), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.userUtcOffset
    });
    req.endTime = format(this.getEndTimeReq(), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.userUtcOffset
    });

    req.startTime = encodeURIComponent(req.startTime);
    req.endTime = encodeURIComponent(req.endTime);
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      this.reportService.generateDownloadCsvUrl(req, { orgUuid: X.orgUuid, sessionToken: X.sessionToken })
    );
    element.setAttribute('target', '_blank');
    element.style.display = 'none';
    element.click();
  }

  private verifyAndFetchReports() {
    this.spinnerService.showSpinner();
    const body = {
      service: IAM_SERVICES.billing,
      action: IAM_BILLING_ACTIONS.view_reports,
      resource: '*'
    };
    this.iamService.verifyUser(body).subscribe(
      _ => {
        this.fetchReports();
      },
      error => {
        this.spinnerService.hideSpinner();
        if (error.code === 'auth.iamActionUnauthorized') {
          this.router.navigate(['landing']);
        } else {
          this.toastService.error(error.message || 'Cannot verify user. Please try again later.');
        }
      }
    );
  }

  private fetchReports() {
    forkJoin([
      this.orgService.getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid]),
      this.reportService.fetchReportsV2()
    ])
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        ([org, reports]) => {
          this.codes = reports;
          this.userUtcOffset = org.utcOffset;

          this.showReport = true;
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  private calculateMaxEnd(): void {
    if (!this.code) {
      return;
    }
    switch (this.selectedInterval) {
      case Period['15m']:
        this.maxEnd = min([new Date(), addMinutes(this.startTime, FIFTEEN_MINUTES_INTERVAL)]);
        break;
      case Period['30m']:
        this.maxEnd = min([new Date(), addMinutes(this.startTime, THIRTY_MINUTES_INTERVAL)]);
        break;
      case Period['1h']:
        this.maxEnd = min([new Date(), addMinutes(this.startTime, ONE_HOUR_INTERVAL)]);
        break;
      case Period['1d']:
        this.maxEnd = subDays(min([new Date(), addMinutes(this.startTime, ONE_DAY_INTERVAL)]), 1);
        break;
      case Period['1M']:
        const day = new Date().getDay();
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        this.startTime = startOfMonth(this.startTime);
        this.minEnd = addMonths(this.startTime, 1);
        this.maxEnd = min([addMinutes(this.startTime, ONE_MONTH_INTERVAL), startOfMonth(new Date(year, month, day))]);
        break;
      default:
        this.maxEnd = min([new Date(), addDays(this.startTime, 100)]);
    }
  }

  private limitedTimeRangePossible() {
    const maxRange = subDays(new Date(), 365);
    if (this.datePickerType === 'month') {
      this.minStart = addMonths(startOfMonth(maxRange), 1);
    }
    if (this.startTime) {
      this.minEnd = subDays(this.startTime, 1);
      this.calculateMaxEnd();
    }
  }

  private calculateInterval(diffInMinute: number) {
    switch (true) {
      case diffInMinute <= FIFTEEN_MINUTES_INTERVAL: {
        this.dynamicInterval = Period['15m'];
        break;
      }
      case diffInMinute > FIFTEEN_MINUTES_INTERVAL && diffInMinute <= THIRTY_MINUTES_INTERVAL: {
        this.dynamicInterval = Period['30m'];
        break;
      }
      case diffInMinute > THIRTY_MINUTES_INTERVAL && diffInMinute <= ONE_HOUR_INTERVAL: {
        this.dynamicInterval = Period['1h'];
        break;
      }
      case diffInMinute > ONE_HOUR_INTERVAL && diffInMinute <= ONE_DAY_INTERVAL: {
        this.dynamicInterval = Period['1d'];
        break;
      }
    }
  }

  getStartTimeReq() {
    switch (this.selectedInterval) {
      case Period['1d']:
        return startOfDay(this.startTime);
      case Period['1M']:
        return startOfMonth(this.startTime);
      default:
        return this.startTime;
    }
  }

  getEndTimeReq() {
    switch (this.selectedInterval) {
      case Period['1h']:
        return addHours(new Date(this.endTime), 1);
      case Period['1d']:
        return addDays(startOfDay(this.endTime), 1);
      case Period['1M']:
        return addMonths(startOfMonth(this.endTime), 1);
      default:
        return this.endTime;
    }
  }

  private downloadReportV4() {
    this.progressing = true;
    const diffInMinute = differenceInMinutes(this.endTime, this.startTime);
    this.calculateInterval(diffInMinute);
    const period = this.code.period === Period.dump ? Period.dump : this.selectedInterval;

    this.startTime.setSeconds(0);
    if (this.selectedSingleTimer) {
      this.endTime = this.startTime;
    }
    this.endTime.setSeconds(0);

    const req = <GetReportV4Payload>{
      startTime: format(this.getStartTimeReq(), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.userUtcOffset
      }),
      endTime: format(this.getEndTimeReq(), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.userUtcOffset
      }),
      period: period
    };

    this.v4Service
      .downloadReport2(period, this.code.code, req, { orgUuid: X.orgUuid, sessionToken: X.sessionToken })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        response => {
          downloadData(
            new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
            getFilenameFromHeader(response.headers)
          );
        },
        error => {
          const errObj = JSON.parse(error);
          this.toastService.error(errObj?.message || 'Cannot download report. Please try again later.');
        }
      );
  }

  onChangeAggregatevePeriod() {
    this.startTime = null;
    this.endTime = null;

    this.updateDatePickerType();
    this.updateClockStep();
  }

  updateDatePickerType() {
    switch (this.selectedInterval) {
      case Period['15m']:
      case Period['30m']:
      case Period['1h']:
        this.datePickerType = 'datetime';
        this.minStart = subDays(new Date(), 100);
        break;
      case Period['1d']:
        this.datePickerType = 'date';
        this.minStart = subDays(new Date(), 365);
        break;
      case Period['1M']:
        this.datePickerType = 'month';
        this.minStart = subDays(new Date(), 365);
        break;
      default:
        this.datePickerType = 'datetime';
        this.clockStep = 1;
        this.minStart = subDays(new Date(), 365);
    }
  }

  updateClockStep(): void {
    switch (this.selectedInterval) {
      case Period['15m']:
        this.clockStep = 15;
        break;
      case Period['30m']:
        this.clockStep = 30;
        break;
      case Period['1h']:
        this.clockStep = 60;
        break;
      default:
      // return 1;
    }
  }
}
