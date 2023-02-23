import { KeyValue } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { DPOLookup, LogService, LookupNumber, MediumStatus, RESULT_DPO } from '@b3networks/api/dnc';
import { UserDatePipe } from '@b3networks/shared/auth';
import { DestroySubscriberComponent, downloadData, TimeRangeHelper, TimeRangeKey } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { subDays } from 'date-fns';
import { combineLatest } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';

interface MediumReport {
  mediums: {
    fax: {
      info: DPOLookup;
      display: string;
    };
    sms: {
      info: DPOLookup;
      display: string;
    };
    voice: {
      info: DPOLookup;
      display: string;
    };
  };
  pdpcId: string;
  number: string;
}

@Component({
  selector: 'b3n-compliance',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss']
})
export class ComplianceComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  // search
  searchTextCtr = new FormControl();
  lookResult: MediumReport[] = [];

  // activity logs
  isViewResult: boolean;
  lookuping: boolean;
  loadingDownload: boolean;

  dataSource: MatTableDataSource<LookupNumber> = new MatTableDataSource<LookupNumber>();
  timeRange = TimeRangeKey.today;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  configDatepicker = {
    showSeconds: false,
    enableMeridian: false,
    minStart: new Date('01-01-2021'),
    maxStart: new Date(),
    minEnd: new Date('01-01-2021'),
    maxEnd: new Date()
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('inputSearch', { static: true }) inputSearch: ElementRef;

  readonly RESULT_DPO = RESULT_DPO;
  readonly displayedColumnsResult = ['no', 'voice', 'sms', 'fax', 'pdpcId'];
  readonly displayedColumnsActivity = [
    'txnUuid',
    'target',
    'from',
    'when',
    'medium',
    'DNC-status',
    'pdpc-id',
    'remark'
  ];
  readonly TimeRangeKey = TimeRangeKey;
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.specific_date, value: 'Specific date time' }
  ];

  constructor(
    private identityProfileQuery: IdentityProfileQuery,
    private logService: LogService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private userDatePipe: UserDatePipe
  ) {
    super();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.inputSearch) {
        this.inputSearch.nativeElement.focus();
      }
    }, 300);
  }

  ngOnInit(): void {
    this.identityProfileQuery.currentOrg$
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        this.timeZone = org.utcOffset;
      });
  }

  export() {
    let data = 'TXN UUID,Target,From,When,Medium,Result,Cause,Reason,PDPC ID,Remark\n';
    data += this.dataSource.data
      ?.map(
        item =>
          `${item.txnUuid || ''},${item.number},${
            item.credentialDetail?.trim()?.split(',')?.[0]
          },${this.userDatePipe.transform(item.time)},${item.medium},${item.result},${item.cause},${
            RESULT_DPO?.[item.result]?.[item.cause]
          },${item.pdpcTxnId || ''},${item.bypassReason || ''}`
      )
      ?.join('\n');
    downloadData(new Blob(['\ufeff', data]), `export-activity-log-${new Date().getTime()}.csv`);
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  onSelectRange() {
    if (this.timeRange === TimeRangeKey.specific_date) {
      return;
    }
    this.onSearch();
  }

  startDateChanged() {
    this.configDatepicker.minEnd = this.startDate ? subDays(new Date(this.startDate), 1) : new Date('01-01-2021');
    this.onSearch();
  }

  endDateChanged() {
    this.configDatepicker.maxStart = this.endDate ? this.endDate : new Date();
    this.onSearch();
  }

  onFilterChanged() {
    if (!this.searchTextCtr.value) {
      return;
    }

    this.lookup();
    this.onSearch();
  }

  private lookup() {
    this.lookuping = true;
    combineLatest([
      this.logService.lookupRateSearch('+' + this.searchTextCtr.value?.toString(), MediumStatus.sms),
      this.logService.lookupRateSearch('+' + this.searchTextCtr.value?.toString(), MediumStatus.fax),
      this.logService.lookupRateSearch('+' + this.searchTextCtr.value?.toString(), MediumStatus.voice)
    ])
      .pipe(finalize(() => (this.lookuping = false)))
      .subscribe(
        ([sms, fax, voice]) => {
          this.lookResult = [
            <MediumReport>{
              mediums: {
                fax: {
                  info: fax,
                  display: RESULT_DPO?.[fax?.result]?.[fax?.cause]
                },
                sms: {
                  info: sms,
                  display: RESULT_DPO?.[sms?.result]?.[sms?.cause]
                },
                voice: {
                  info: voice,
                  display: RESULT_DPO?.[voice?.result]?.[voice?.cause]
                }
              },
              pdpcId: sms?.pdpcTxnId || fax?.pdpcTxnId || voice?.pdpcTxnId,
              number: this.searchTextCtr.value?.toString()
            }
          ];
          this.isViewResult = true;
        },
        err => {
          this.toastService.error(`Cannot lookup rate because ${err.message.toLowerCase()}`);
        }
      );
  }

  private onSearch() {
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(this.timeRange, this.timeZone);
    if (this.timeRange === TimeRangeKey.specific_date) {
      timeRange.startDate = new Date(this.startDate).toString();
      timeRange.endDate = (this.endDate ? new Date(this.endDate) : new Date())?.toString();
    } else {
      timeRange.startDate = new Date(timeRange.startDate).toString();
      timeRange.endDate = new Date(timeRange.endDate)?.toString();
    }

    this.logService
      .lookupNumberV3(
        '+' + this.searchTextCtr.value,
        new Date(timeRange.startDate).getTime(),
        new Date(timeRange.endDate).getTime()
      )
      .subscribe(res => {
        this.updateDataSource(res);
      });
  }

  private updateDataSource(data: LookupNumber[]) {
    this.dataSource.data = data;

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 300);
  }
}
