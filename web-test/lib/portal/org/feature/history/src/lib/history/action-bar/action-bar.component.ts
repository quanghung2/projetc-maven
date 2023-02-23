import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Team } from '@b3networks/api/auth';
import { CallType, EnumScope, StatusCall } from '@b3networks/api/data';
import { UnifiedHistoryFilter } from '@b3networks/api/portal';
import { TimeRangeKey } from '@b3networks/shared/common';
import { addDays, isAfter, subDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { debounceTime } from 'rxjs/operators';

export enum ResourceFilter {
  CR = 'CR',
  VM = 'VM'
}

@Component({
  selector: 'poh-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent implements OnInit, OnChanges {
  readonly ResourceFilter = ResourceFilter;
  readonly TimeRangeKey = TimeRangeKey;
  readonly EnumScope = EnumScope;
  readonly CallType = CallType;
  readonly StatusCall = StatusCall;
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.last1year, value: 'Last 1 Year' },
    { key: TimeRangeKey.specific_date, value: 'Specific date time' }
  ];
  readonly callTypes: KeyValue<CallType, string>[] = [
    { key: CallType.all, value: 'All' },
    { key: CallType.incoming, value: 'Incoming' },
    { key: CallType.outgoing, value: 'Outgoing' },
    { key: CallType.forwarding, value: 'Forwarding' }
    // { key: CallType.internal, value: 'Internal' }
  ];
  readonly statusCall: KeyValue<StatusCall, string>[] = [
    { key: StatusCall.all, value: 'All' },
    { key: StatusCall.answered, value: 'Answered' },
    { key: StatusCall.unanswered, value: 'Unanswered' },
    { key: StatusCall.busy, value: 'Busy' },
    { key: StatusCall.cancel, value: 'Cancel' },
    { key: StatusCall.blocked, value: 'Blocked' },
    { key: StatusCall.failed, value: 'Failed' },
    { key: StatusCall.delegated, value: 'Delegated' }
  ];

  @Input() isUnifiedWorkspace = false;
  @Input() filter: UnifiedHistoryFilter;
  @Input() timeZone = '08:00';
  @Input() managedTeams: Team[] = [];
  @Input() noTitle = false;
  @Input() noDateRange = false;
  @Input() noTeams = false;
  @Input() loading = false;
  @Input() loadingDownload = false;
  @Input() history: any;

  @Output() filterChanged = new EventEmitter();
  @Output() downloadHistory = new EventEmitter();

  advancedSearch = false;

  searchTextCtr = new UntypedFormControl();

  configDatepicker = {
    showSeconds: false,
    enableMeridian: false,
    minStart: new Date('01-01-2021'),
    maxStart: new Date(),
    minEnd: new Date('01-01-2021'),
    maxEnd: new Date()
  };

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    this.searchTextCtr.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.filter.inputSearch = value;
      this.onFilterChanged();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeZone'] && changes['timeZone'].currentValue) {
      const max = this.nowDate();
      const min = this.minimumDate();
      this.configDatepicker.minStart = min;
      this.configDatepicker.minEnd = min;
      this.configDatepicker.maxStart = max;
      this.configDatepicker.maxEnd = max;
    }
  }

  refresh() {
    this.onFilterChanged();
  }

  onFilterChanged(resourceFilter?: ResourceFilter) {
    if (!this.filter.hasResource) {
      delete this.filter.hasResource;
    }
    if (!this.filter.hasRecording || resourceFilter === ResourceFilter.VM) {
      delete this.filter.hasRecording;
    }
    if (!this.filter.hasVoicemail || resourceFilter === ResourceFilter.CR) {
      delete this.filter.hasVoicemail;
    }
    if (this.filter.timeRange === TimeRangeKey.specific_date && (!this.filter.startDate || !this.filter.endDate)) {
      return;
    }
    this.filterChanged.emit();
  }

  onDownloadHistory(type: string) {
    this.downloadHistory.emit(type);
  }

  onSelectTeam($event: MatSelectChange) {
    if (!$event.value) {
      return;
    }
    this.filterChanged.emit();
  }

  onSelectRange() {
    if (this.filter.timeRange === TimeRangeKey.specific_date) {
      return;
    }
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

  private nowDate() {
    return utcToZonedTime(new Date(), this.timeZone);
  }

  private minimumDate() {
    return utcToZonedTime(subDays(new Date(), 600), this.timeZone);
  }
}
