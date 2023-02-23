import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { UntypedFormControl } from '@angular/forms';
import { CommunicationAppSettings } from '@b3networks/api/portal';

@Component({
  selector: 'b3n-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent extends DestroySubscriberComponent implements OnInit {
  readonly intervalTimes: KeyValue<number, string>[] = [
    { key: 10 * 1000, value: 'Every 10 seconds' },
    { key: 30 * 1000, value: 'Every 30 seconds' },
    { key: 1 * 60 * 1000, value: 'Every 1 minute' },
    { key: 5 * 60 * 1000, value: 'Every 5 minutes' }
  ];
  readonly sortAgentBy: KeyValue<string, string>[] = [
    { key: 'name', value: 'Name' },
    { key: 'status', value: 'Status' },
    { key: 'extension', value: 'Extension Key' }
  ];

  ALL_QUEUES = 'all_queues';

  minDate = new Date();
  maxDate = new Date();

  dateRange = { start: null, end: null };

  @Input() settings: CommunicationAppSettings;
  @Input() queues: QueueInfo[];
  @Input() totalAgentCount: number;
  @Input() fetching: boolean;

  @Output() filterChanged = new EventEmitter<CommunicationAppSettings>();
  @Output() requestExport = new EventEmitter<boolean>();

  menuCtrl = new UntypedFormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    this.minDate.setDate(this.minDate.getDate() - 100);
    this.dateRange.start = this.settings.userPerformance.dateFiltering.startDate
      ? new Date(this.settings.userPerformance.dateFiltering.startDate)
      : new Date();
    this.dateRange.end = this.settings.userPerformance.dateFiltering.endDate
      ? new Date(this.settings.userPerformance.dateFiltering.endDate)
      : new Date();
  }

  onFilterChanged() {
    if (this.dateRange.start || this.dateRange.end) {
      this.settings.userPerformance.dateFiltering = {};
    }
    this.settings.userPerformance.dateFiltering['startDate'] = this.dateRange.start;
    this.settings.userPerformance.dateFiltering['endDate'] = this.dateRange.end;
    this.filterChanged.emit(this.settings);
  }

  startDateChanged() {
    this.onFilterChanged();
  }

  export() {
    this.requestExport.emit(true);
  }

  compareCode(a: string, b: string) {
    return a && b && a === b;
  }
}
