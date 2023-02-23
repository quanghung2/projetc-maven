import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { DialogPosition, MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Agent, AgentQuery, ChatTypeTxn } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { GetReportV4Payload, Period, ReportV4Code, TxnChatLog, V4Service } from '@b3networks/api/data';
import { Inbox, InboxesQuery } from '@b3networks/api/inbox';
import { UnifiedHistoryFilter } from '@b3networks/api/portal';
import { DestroySubscriberComponent, TimeRangeHelper, TimeRangeKey } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, isAfter, subDays } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { forkJoin, Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  startWith,
  switchMap,
  take,
  takeUntil
} from 'rxjs/operators';
import {
  PreviewHistoryTxnComponent,
  PreviewHistoryTxnData
} from '../../shared/component/preview-history-txn/preview-history-txn.component';

@Component({
  selector: 'b3n-completed-chats',
  templateUrl: './completed-chats.component.html',
  styleUrls: ['./completed-chats.component.scss']
})
export class CompletedChatsComponent extends DestroySubscriberComponent implements OnInit {
  timeZone: string;
  filter: UnifiedHistoryFilter = {
    timeRange: TimeRangeKey.today,
    startDate: null,
    endDate: null,
    channel: 'All'
  };
  ui = {
    paging: new Pageable(1, 10),
    backUpPrevious: <TxnChatLog[]>null,
    currentHistories: <TxnChatLog[]>[],
    backUpNext: <TxnChatLog[]>null
  };
  configDatepicker = {
    showSeconds: false,
    enableMeridian: false,
    minStart: new Date('01-01-2021'),
    maxStart: new Date(),
    minEnd: new Date('01-01-2021'),
    maxEnd: new Date()
  };

  isUpperAdmin: boolean;
  loading: boolean;
  searchTextCtr = new UntypedFormControl();
  agentCtr = new UntypedFormControl('All');
  inboxCtr = new UntypedFormControl('All');
  agents$: Observable<Agent[]>;
  inboxes$: Observable<Inbox[]>;

  readonly columns = ['txnUuid', 'inboxUuid', 'channel', 'createdAt', 'numOfAgent', 'customer', 'actions'];
  readonly TimeRangeKey = TimeRangeKey;
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.last60days, value: 'Last 60 days' },
    { key: TimeRangeKey.last90days, value: 'Last 90 days' },
    { key: TimeRangeKey.specific_date, value: 'Specific date time' }
  ];
  readonly channelOpts: KeyValue<ChatTypeTxn | string, string>[] = [
    { key: ChatTypeTxn.livechat, value: 'Livechat' },
    { key: ChatTypeTxn.whatsapp, value: 'Whatsapp' }
  ];

  get searchKeyInbox() {
    const key = this.inboxCtr.value;
    return typeof key === 'string' && key !== 'All' ? key : '';
  }

  get searchKey() {
    const key = this.agentCtr.value;
    return typeof key === 'string' && key !== 'All' ? key : '';
  }

  constructor(
    private toastService: ToastService,
    private profileQuery: IdentityProfileQuery,
    private v4Service: V4Service,
    private agentQuery: AgentQuery,
    private dialog: MatDialog,
    private inboxesQuery: InboxesQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.profileQuery.currentOrg$
      .pipe(
        filter(x => x != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        this.isUpperAdmin = this.profileQuery.currentOrg.isUpperAdmin;
        this.timeZone = org.utcOffset;
        const max = this.nowDate();
        const min = this.minimumDate();
        this.configDatepicker.minStart = min;
        this.configDatepicker.minEnd = min;
        this.configDatepicker.maxStart = max;
        this.configDatepicker.maxEnd = max;
        this.onFilterChanged();
        this.inboxes$ = this.inboxesQuery.all$;
      });

    this.searchTextCtr.valueChanges
      .pipe(
        debounceTime(300),
        filter(x => x != null)
      )
      .subscribe(() => this.onFilterChanged());

    this.agentCtr.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroySubscriber$))
      .subscribe(value => {
        if (value instanceof Agent || value === 'All') {
          this.onFilterChanged();
        }
      });

    this.inboxCtr.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroySubscriber$))

      .subscribe(value => {
        if (value instanceof Inbox || value === 'All') {
          this.onFilterChanged();
        }
      });

    this.agents$ = this.agentCtr.valueChanges.pipe(
      debounceTime(300),
      startWith(this.agentCtr.value),
      switchMap(value => {
        if (value instanceof Agent || value === 'All' || !value?.trim()) {
          return this.agentQuery.selectAll();
        }

        return this.agentQuery.selectAllAgentsContains(value?.trim());
      })
    );
  }

  displayFn(member: Agent | string): string {
    return member === 'All' ? 'All' : (<Agent>member)?.displayText;
  }

  displayFnInbox(inbox: Inbox | string): string {
    return inbox === 'All' ? 'All' : (<Inbox>inbox)?.name;
  }

  viewHistory(history: TxnChatLog, event: MouseEvent) {
    event.stopPropagation();
    this.dialog.open(PreviewHistoryTxnComponent, {
      data: <PreviewHistoryTxnData>{
        txn: history
      },
      width: '50%',
      minWidth: '800px',
      height: '100%',
      maxWidth: 'unset',
      position: <DialogPosition>{ right: '0px' },
      panelClass: 'preview-message',
      autoFocus: false
    });
  }

  onSelectRange() {
    if (this.filter.timeRange === TimeRangeKey.specific_date) {
      return;
    }
    this.onFilterChanged();
  }

  onSelectChannel() {
    this.onFilterChanged();
  }

  startDateChanged() {
    if (this.filter.startDate) {
      this.configDatepicker.minEnd = subDays(new Date(this.filter.startDate), 1);
      const day100 = utcToZonedTime(addDays(this.configDatepicker.minEnd, 100), this.timeZone);
      this.configDatepicker.maxEnd = isAfter(day100, this.nowDate()) ? this.nowDate() : day100;
    } else {
      this.configDatepicker.minEnd = this.minimumDate();
      this.configDatepicker.maxEnd = this.nowDate();
    }
    this.onFilterChanged();
  }

  endDateChanged() {
    if (this.filter.endDate) {
      this.configDatepicker.maxStart = this.filter.endDate;
      const day100 = utcToZonedTime(subDays(this.filter.endDate, 100), this.timeZone);
      this.configDatepicker.minStart = isAfter(this.minimumDate(), day100) ? this.minimumDate() : day100;
    } else {
      this.configDatepicker.maxStart = this.nowDate();
      this.configDatepicker.minStart = this.minimumDate();
    }
    this.onFilterChanged();
  }

  onFilterChanged() {
    // reset paging
    this.ui.paging.page = 1;
    this.fetchDataHistories();
  }

  trackTask(index: number, item: TxnChatLog): string {
    return item?.txnUuid;
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
  }

  nextPage() {
    this.loading = true;
    this.ui.backUpPrevious = this.ui.currentHistories;
    this.ui.currentHistories = this.ui.backUpNext;
    this.ui.backUpNext = null;
    this.ui.paging.page++;
    this.loadMore(true);
  }

  private fetchDataHistories() {
    const next = Object.assign({}, this.ui.paging);
    next.page++;
    const req = this.buildRequest();
    this.loading = true;

    const api$ = forkJoin([
      this.v4Service
        .getReportData<TxnChatLog>(Period.dump, ReportV4Code.chatUnifiedHistory, req, this.ui.paging, false)
        .pipe(map(res => res?.rows || [])),
      this.v4Service
        .getReportData<TxnChatLog>(Period.dump, ReportV4Code.chatUnifiedHistory, req, next, false)
        .pipe(map(res => res?.rows || []))
    ]);

    api$.pipe(finalize(() => (this.loading = false))).subscribe(res => {
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
      .getReportData<TxnChatLog>(Period.dump, ReportV4Code.chatUnifiedHistory, this.buildRequest(), handlePage, false)
      .pipe(
        map(res => res?.rows || []),
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

    const req = <GetReportV4Payload>{};
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

    req.startTime = timeRange.startDate;
    req.endTime = timeRange.endDate;
    req.filter = {
      status: 'end'
    };
    if (this.filter.channel !== 'All') {
      req.filter = {
        ...req.filter,
        channel: this.filter.channel
      };
    }
    if (this.searchTextCtr?.value) {
      req.filter = {
        ...req.filter,
        txnUuid: this.searchTextCtr.value
      };
    }

    if (this.inboxCtr.value instanceof Inbox) {
      req.filter = {
        ...req.filter,
        accessors: this.inboxCtr.value?.uuid
      };
    }

    if (this.isUpperAdmin) {
      if (this.agentCtr.value instanceof Agent) {
        req.filter = {
          ...req.filter,
          agentUuids: this.agentCtr.value?.identityUuid
        };
      }
    } else {
      req.filter = {
        ...req.filter,
        agentUuids: this.profileQuery.getProfile().uuid
      };
    }
    return req;
  }

  private nowDate() {
    return utcToZonedTime(new Date(), this.timeZone);
  }

  private minimumDate() {
    return utcToZonedTime(subDays(new Date(), 600), this.timeZone);
  }
}
