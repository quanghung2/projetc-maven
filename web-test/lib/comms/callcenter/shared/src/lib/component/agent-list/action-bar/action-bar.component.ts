import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QueueInfo } from '@b3networks/api/callcenter';
import { CallcenterAppSettings } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

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

  dateRange: { start: string | Date; end: string | Date } = { start: null, end: null };

  @Input() settings: CallcenterAppSettings;
  @Input() queues: QueueInfo[];
  @Input() totalAgentCount: number;
  @Input() fetching: boolean;

  @Output() filterChanged = new EventEmitter<CallcenterAppSettings>();
  @Output() requestExport = new EventEmitter<boolean>();

  constructor() {
    super();
  }

  ngOnInit() {
    this.minDate.setDate(this.minDate.getDate() - 100);
    this.dateRange.start = this.settings.workspaceAgents.dateFiltering.startDate
      ? new Date(this.settings.workspaceAgents.dateFiltering.startDate)
      : new Date();
    this.dateRange.end = this.settings.workspaceAgents.dateFiltering.endDate
      ? new Date(this.settings.workspaceAgents.dateFiltering.endDate)
      : new Date();
  }

  onFilterChanged() {
    if (this.dateRange.start || this.dateRange.end) {
      this.settings.workspaceAgents.dateFiltering = {};
    }
    this.settings.workspaceAgents.dateFiltering['startDate'] = this.dateRange.start;
    this.settings.workspaceAgents.dateFiltering['endDate'] = this.dateRange.end;
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
