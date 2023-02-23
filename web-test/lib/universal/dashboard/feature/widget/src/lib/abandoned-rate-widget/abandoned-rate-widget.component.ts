import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType } from '@b3networks/api/dashboard';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

class AbandonedRecord {
  queue: string;
  total: number;
  shortAbandoned: number;
  longAbandoned: number;
  unansweredCallback: number;
  voicemail: number;
  rate: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
    const rate = this.longAbandoned / (this.total - this.shortAbandoned - this.unansweredCallback - this.voicemail);
    this.rate = isNaN(rate) ? 0 : rate;
  }
}

@Component({
  selector: 'b3n-abandoned-rate-widget',
  templateUrl: './abandoned-rate-widget.component.html',
  styleUrls: ['./abandoned-rate-widget.component.scss']
})
export class AbandonedRateWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  chartData: any;

  records: AbandonedRecord[];

  readonly ChartType = ChartType;
  readonly ObjectKeys = Object.keys;
  readonly displayColumns = [
    'queue',
    'total',
    'longAbandoned',
    'shortAbandoned',
    'unansweredCallback',
    'voicemail',
    'rate'
  ];

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.chartData = this.widgetTransform.buildChartData(this.data);

      const queueSet = new Set<string>();
      const datasetMap: any = {};

      this.chartData.datasets.forEach(dataset => {
        const id = dataset['id'];

        const queueMapping = {};
        dataset.data.forEach((row: any[]) => {
          queueSet.add(row[0]);
          queueMapping[row[0]] = row;
        });

        datasetMap[id] = queueMapping;
      });

      if (this.chartData.datasets.length === 2) {
        // build for v4
        this.records = Array.from(queueSet)
          .map(queue => {
            const inbound = datasetMap['inbound'][queue] || {};
            const callback = datasetMap['callback'][queue] || {};
            return new AbandonedRecord({
              queue: queue,
              total: inbound[1] || 0,
              longAbandoned: inbound[2] || 0,
              shortAbandoned: inbound[3] || 0,
              unansweredCallback: callback[1] || 0,
              voicemail: inbound[4] || 0
            });
          })
          .sort((a, b) => b.rate - a.rate);
      } else {
        this.records = Array.from(queueSet)
          .map(queue => {
            return new AbandonedRecord({
              queue: queue,
              total: datasetMap['totalCall'][queue] ? datasetMap['totalCall'][queue][1] : 0,
              longAbandoned: datasetMap['abandonedAboveThreshold'][queue]
                ? datasetMap['abandonedAboveThreshold'][queue][1]
                : 0,
              shortAbandoned: datasetMap['abandonedWithinThreshold'][queue]
                ? datasetMap['abandonedWithinThreshold'][queue][1]
                : 0,
              unansweredCallback: datasetMap['callbackUnanswered'][queue]
                ? datasetMap['callbackUnanswered'][queue][1]
                : 0,
              voicemail: datasetMap['voicemail'][queue] ? datasetMap['voicemail'][queue][1] : 0
            });
          })
          .sort((a, b) => b.rate - a.rate);
      }
    }
  }
}
