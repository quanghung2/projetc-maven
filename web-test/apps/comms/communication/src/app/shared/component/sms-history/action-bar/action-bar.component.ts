import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { SmsHistoryFilter, SmsStatus, SmsType, UnifiedSMSHistory } from '@b3networks/api/data';
import { TimeRangeKey } from '@b3networks/shared/common';
import { subDays } from 'date-fns';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'b3n-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent implements OnInit {
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
  readonly types: KeyValue<SmsType, string>[] = [
    { key: SmsType.all, value: 'All' },
    { key: SmsType.incoming, value: 'Incoming' },
    { key: SmsType.outgoing, value: 'Outgoing' }
  ];
  readonly statusCall: KeyValue<SmsStatus, string>[] = [
    { key: SmsStatus.all, value: 'All' },
    { key: SmsStatus.queued, value: 'Queued' },
    { key: SmsStatus.sent, value: 'Sent' },
    { key: SmsStatus.delivered, value: 'Delivered' },
    { key: SmsStatus.deliveryFailed, value: 'Delivery Failed' },
    { key: SmsStatus.rejected, value: 'Rejected' },
    { key: SmsStatus.deliveryExpired, value: 'Delivery Expired' }
  ];

  @Input() filter: SmsHistoryFilter;
  @Input() timeZone: string;
  @Input() loading: boolean;
  @Input() loadingDownload: boolean;
  @Input() history: UnifiedSMSHistory[];
  @Input() noDateRange: boolean;

  @Output() filterChanged = new EventEmitter();
  @Output() downloadHistory = new EventEmitter();

  advancedSearch: boolean;

  searchTextCtr = new UntypedFormControl();

  configDatepicker = {
    showSeconds: false,
    enableMeridian: false,
    minStart: new Date('01-01-2021'),
    maxStart: new Date(),
    minEnd: new Date('01-01-2021'),
    maxEnd: new Date()
  };

  constructor() {}

  ngOnInit(): void {
    this.searchTextCtr.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.filter.inputSearch = value;
      this.onFilterChanged();
    });
  }

  refresh() {
    this.onFilterChanged();
  }

  onFilterChanged() {
    if (this.filter.timeRange === TimeRangeKey.specific_date && !this.filter.startDate) {
      return;
    }
    this.filterChanged.emit();
  }

  onDownloadHistory(type: string) {
    this.downloadHistory.emit(type);
  }

  onSelectRange() {
    if (this.filter.timeRange === TimeRangeKey.specific_date) {
      return;
    }
    this.onFilterChanged();
  }

  startDateChanged() {
    this.configDatepicker.minEnd = this.filter.startDate
      ? subDays(new Date(this.filter.startDate), 1)
      : new Date('01-01-2021');
    this.onFilterChanged();
  }

  endDateChanged() {
    this.configDatepicker.maxStart = this.filter.endDate ? this.filter.endDate : new Date();
    this.onFilterChanged();
  }
}
