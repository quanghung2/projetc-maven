import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import {
  AuditEventName,
  CustomerQuery,
  CustomerService,
  EventNameDescription,
  ModuleDescription
} from '@b3networks/api/audit';
import { TimeRangeKey } from '@b3networks/shared/common';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
@Component({
  selector: 'poa-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent implements OnChanges {
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey['15m'], value: 'Last 15 minutes' },
    { key: TimeRangeKey['30m'], value: 'Last 30 minutes' },
    { key: TimeRangeKey['1h'], value: 'Last 1 hour' },
    { key: TimeRangeKey['4h'], value: 'Last 4 hours' },
    { key: TimeRangeKey['12h'], value: 'Last 12 hours' },
    { key: TimeRangeKey.today, value: 'Last 24 hours' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last30days, value: 'Last 30 days' },
    { key: TimeRangeKey.last60days, value: 'Last 60 day' },
    { key: TimeRangeKey.last90days, value: 'Last 90 days' },
    { key: TimeRangeKey.last6months, value: 'Last 6 months' },
    { key: TimeRangeKey.last1year, value: 'Last 1 year' },
    { key: TimeRangeKey.specific_date, value: 'Specific date' }
  ];

  formGroup: UntypedFormGroup;

  clockStep = '1';
  maxStart: string;
  minStart: string;
  maxEnd: string;
  minEnd: string;

  isLoading: boolean;
  @Input() timeZone: string;
  @Input() auditEventName: AuditEventName[];
  @Input() selectedModuleFilter: ModuleDescription;
  @Input() actionOptions: EventNameDescription[];
  @Output() onSearch = new EventEmitter();
  @Output() filterChange = new EventEmitter();
  @Output() onAppChange = new EventEmitter<string>();

  constructor(
    private fb: UntypedFormBuilder,
    private customerService: CustomerService,
    private customerQuery: CustomerQuery
  ) {
    this.formGroup = this.fb.group({
      lastTimeFilter: [''],
      moduleFilter: [''],
      actionFilter: [''],
      userFilter: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      query: ['']
    });

    this.customerQuery.loading$.subscribe(isLoading => (this.isLoading = isLoading));
  }

  get isShowSpecialDate() {
    return this.formGroup.controls['lastTimeFilter'].value === TimeRangeKey.specific_date;
  }

  get lastTimeFilter() {
    return this.formGroup.get('lastTimeFilter');
  }
  get startDate() {
    return this.formGroup.get('startDate');
  }

  get endDate() {
    return this.formGroup.get('endDate');
  }

  get userFilter() {
    return this.formGroup.get('userFilter');
  }

  get actionFilter() {
    return this.formGroup.get('actionFilter');
  }

  get query() {
    return this.formGroup.get('query');
  }

  get moduleFilter() {
    return this.formGroup.get('moduleFilter');
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { lastTimeFilter, actionFilter } = this.customerQuery.getUi();
    if (changes['timeZone'] && changes['timeZone'].currentValue) {
      const max = format(utcToZonedTime(new Date(), this.timeZone), "yyyy-MM-dd'T'HH:mm:ssxxx");

      this.maxStart = max;
      this.maxEnd = max;
    }
    this.lastTimeFilter.setValue(lastTimeFilter);
    this.moduleFilter.setValue(this.selectedModuleFilter);
    this.actionFilter.setValue(actionFilter);
  }

  ngOnInit(): void {}

  onTimeRangeChanged(event: MatSelectChange) {
    this.customerService.updateAuditFilter({ lastTimeFilter: event.value });
    if (this.isShowSpecialDate) {
      return;
    }
    this.setDataForQuery();
  }

  onAppChanged(event: MatSelectChange) {
    this.customerService.updateAuditFilter({ moduleFilter: event.value, actionFilter: '' });
    this.setDataForQuery();
    this.onAppChange.emit(event.value);
  }

  onActionChanged(event: MatSelectChange) {
    this.customerService.updateAuditFilter({ actionFilter: event.value });
    this.setDataForQuery();
  }

  onChangedUser() {
    this.setDataForQuery();
  }

  onChangedQuery() {
    this.setDataForQuery();
  }

  startDateChanged() {
    this.minEnd = this.startDate.value ? this.startDate.value : null;
    if (this.isShowSpecialDate && !this.startDate.value) {
      return;
    }
    this.customerService.updateAuditFilter({ startDate: this.startDate.value, endDate: this.endDate.value });
    this.setDataForQuery();
  }

  endDateChanged() {
    this.maxStart = this.endDate.value ? this.endDate.value : null;
    if (this.isShowSpecialDate && !this.endDate.value) {
      return;
    }
    this.customerService.updateAuditFilter({ startDate: this.startDate.value, endDate: this.endDate.value });
    this.setDataForQuery();
  }

  onSearchLog() {
    if (this.isShowSpecialDate && (!this.startDate.value || !this.endDate.value)) {
      return;
    }
    this.setDataForQuery();
  }

  private setDataForQuery() {
    this.customerService.updateAuditFilter({ userFilter: this.userFilter.value, queryFilter: this.query.value });
    this.filterChange.emit();
  }
}
