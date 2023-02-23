import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { MeQuery, TxnType } from '@b3networks/api/callcenter';
import { CallcenterCallLogSetting } from '@b3networks/api/portal';
import { DestroySubscriberComponent, TimeRangeKey } from '@b3networks/shared/common';
import { MatDatepickerInputEvent } from '@matheo/datepicker';
import { format, startOfDay } from 'date-fns';
import { CALLBACK, INCOMING, OVERFLOW } from '../../../constants';
import { CallLogPageType } from '../call-log.component';

enum FilterType {
  txnUuid = 'txnUuid',
  agent = 'agent',
  queue = 'queue',
  code = 'code',
  note = 'note'
}

const MAXIMUM_SUPPORTED_DAYS_FOR_DUMP_REPORTS = 365;

@Component({
  selector: 'b3n-call-log-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallLogBarComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly filterBys: KeyValue<FilterType, string>[] = [
    { key: FilterType.txnUuid, value: 'Txn. Uuid' },
    { key: FilterType.agent, value: 'Agent' },
    { key: FilterType.queue, value: 'Queue' },
    { key: FilterType.code, value: 'Code' }
  ];
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.last60days, value: 'Last 60 days' },
    { key: TimeRangeKey.last90days, value: 'Last 90 days' },
    { key: TimeRangeKey.specific_date, value: 'Specific date' }
  ];
  readonly TimeRange = TimeRangeKey;

  callTypes: KeyValue<TxnType, string>[] = [INCOMING, CALLBACK];
  minStart: Date = new Date();
  minEnd: Date = new Date();
  maxStart: Date = new Date();
  maxEnd: Date = new Date();

  isAdvancedSearch: boolean;

  @Input() filter: CallcenterCallLogSetting;
  @Input() logPageType: CallLogPageType;
  @Input() timezone: string;

  @Output() filterChange: EventEmitter<CallcenterCallLogSetting> = new EventEmitter();
  @Output() export = new EventEmitter<CallcenterCallLogSetting>();

  constructor(private meQuery: MeQuery) {
    super();
  }

  ngOnInit() {
    this.minStart.setDate(new Date().getDate() - MAXIMUM_SUPPORTED_DAYS_FOR_DUMP_REPORTS);
    const me = this.meQuery.getMe();
    this.callTypes =
      this.logPageType === CallLogPageType.unanswered && me?.isSupervisor
        ? [INCOMING, CALLBACK, OVERFLOW]
        : [INCOMING, CALLBACK];
  }

  ngOnChanges(changes: SimpleChanges): void {
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.
    if (changes['filter']) {
      this.isAdvancedSearch =
        this.filter && (!!this.filter.txnUuid || !!this.filter.toNumber || !!this.filter.fromNumber);
    }
  }

  startDateChanged(event: MatDatepickerInputEvent<any, any>) {
    this.filter.startDate = format(startOfDay(new Date(event.value)), "yyyy-MM-dd'T'HH:mm:ssxxx");
    this.minEnd = startOfDay(new Date(event.value));
    this.onFilterChanged();
  }

  endDateChanged(event: MatDatepickerInputEvent<any, any>) {
    this.filter.endDate = format(startOfDay(new Date(event.value)), "yyyy-MM-dd'T'HH:mm:ssxxx");
    this.maxStart = startOfDay(new Date(event.value));
    this.onFilterChanged();
  }

  clearAdvancedFilter() {
    this.filter.fromNumber = '';
    this.filter.toNumber = '';
    this.filter.txnUuid = '';
  }

  onExport() {
    this.export.emit(this.filter);
  }

  onFilterChanged() {
    this.filterChange.emit(this.filter);
  }

  compareFn(a: string, b: string) {
    return a && b && a === b;
  }
}
