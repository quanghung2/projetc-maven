import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { QueueInfo } from '@b3networks/api/callcenter';
import { CallcenterAppSettings } from '@b3networks/api/portal';
import { DestroySubscriberComponent, TimeRangeKey } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

declare var _: any;
declare var jQuery: any;
declare var html2canvas: any;

@Component({
  selector: 'b3n-action-bar-dashboard',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent extends DestroySubscriberComponent implements OnInit {
  @Input() filtering: CallcenterAppSettings;
  @Input() queues: QueueInfo[];
  @Input() userUtcOffset: string;

  @Output() switch = new EventEmitter<CallcenterAppSettings>();
  @Output() export = new EventEmitter<CallcenterAppSettings>();

  readonly refreshes = [
    { key: 10 * 1000, value: 'Every 10 seconds' },
    { key: 30 * 1000, value: 'Every 30 seconds' },
    { key: 60 * 1000, value: 'Every 1 minute' },
    { key: 5 * 60 * 1000, value: 'Every 5 minutes' }
  ];

  readonly timeRanges = [
    { key: TimeRangeKey['15m'], value: 'Last 15 minutes' },
    { key: TimeRangeKey['30m'], value: 'Last 30 minutes' },
    { key: TimeRangeKey['1h'], value: 'Last 1 hour' },
    { key: TimeRangeKey['4h'], value: 'Last 4 hours' },
    { key: TimeRangeKey['12h'], value: 'Last 12 hours' },
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.specific_date, value: 'Specific Date' }
  ];

  readonly TODAY = new Date();

  constructor(public toastService: ToastService) {
    super();
  }

  ngOnInit() {}

  filterChanged() {
    if (!!this.filtering.dashboard.timeRange && this.filtering.dashboard.queuesFiltering.length > 0) {
      this.switch.emit(this.filtering);
    }
  }

  timerangeChanged() {
    if (this.filtering.dashboard.timeRange == TimeRangeKey.specific_date && !this.filtering.dashboard.dateFiltering) {
      this.filtering.dashboard.dateFiltering = utcToZonedTime(new Date(), this.userUtcOffset);
    }
    this.filterChanged();
  }

  proceed() {
    this.filterChanged();
  }

  selectAll(select: NgModel, values: QueueInfo[]) {
    select.update.emit(values.map(q => q.uuid));
  }

  deselectAll(select: NgModel) {
    select.update.emit([]);
  }

  compareUuidFn(a: string, b: string) {
    return a && b && a === b;
  }

  exportImage() {
    html2canvas(jQuery('#statistic')[0]).then(canvas => {
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'Inbound' + format(new Date(), '_yyyyMMdd_HHmm') + '.png';
      a.click();
    });
  }

  exportCsv() {
    this.export.emit(this.filtering);
  }
}
