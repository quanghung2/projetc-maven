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
import { UntypedFormControl } from '@angular/forms';
import { QueueInfo } from '@b3networks/api/callcenter';
import { CallcenterWorkspaceFeedbackSetting } from '@b3networks/api/portal';
import { DestroySubscriberComponent, TimeRangeKey } from '@b3networks/shared/common';
import { MatDatepickerInputEvent } from '@matheo/datepicker';
import { format, startOfDay } from 'date-fns';

@Component({
  selector: 'b3n-feedback-bar',
  templateUrl: './feedback-bar.component.html',
  styleUrls: ['./feedback-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedbackBarComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  minStart: Date = new Date();
  minEnd: Date = new Date();
  maxStart: Date = new Date();
  maxEnd: Date = new Date();

  isExpanded = false;

  agentFilterControl: UntypedFormControl = new UntypedFormControl();

  @Input() filter: CallcenterWorkspaceFeedbackSetting;
  @Input() queues: QueueInfo[];

  @Output() filterChange = new EventEmitter<CallcenterWorkspaceFeedbackSetting>();
  @Output() export = new EventEmitter<CallcenterWorkspaceFeedbackSetting>();

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

  constructor() {
    super();
  }

  ngOnInit() {
    this.minStart.setDate(new Date().getDate() - 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filter']) {
      this.isExpanded =
        this.filter && (!!this.filter.agent || !!this.filter.customerNumber || !!this.filter.filterByQueue);
    }
  }

  startDateChanged(event: MatDatepickerInputEvent<any, any>) {
    this.filter.startDate = format(startOfDay(new Date(event.value)), "yyyy-MM-dd'T'HH:mm:ssxxx");
    this.minEnd = startOfDay(new Date(event.value));
    this.filterChange.emit(this.filter);
  }

  endDateChanged(event: MatDatepickerInputEvent<any, any>) {
    this.filter.endDate = format(startOfDay(new Date(event.value)), "yyyy-MM-dd'T'HH:mm:ssxxx");
    this.maxStart = startOfDay(new Date(event.value));
    this.filterChange.emit(this.filter);
  }

  search() {
    if (
      this.filter.timeRange !== TimeRangeKey.specific_date ||
      (this.filter.startDate != null && this.filter.endDate != null)
    ) {
      this.filterChange.emit(this.filter);
    }
  }

  onExport() {
    this.export.emit(this.filter);
  }

  displayAgentFn(agentLabel?: string): string | undefined {
    return agentLabel ? agentLabel : undefined;
  }

  compareQueueFn(a: QueueInfo, b: QueueInfo) {
    return a && b && a.uuid === b.uuid;
  }

  compareCodeFn(a: string, b: string) {
    return a && b && a === b;
  }
}
