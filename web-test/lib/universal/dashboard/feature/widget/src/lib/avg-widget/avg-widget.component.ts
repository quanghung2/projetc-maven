import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType, QuestionType } from '@b3networks/api/dashboard';
import { WidgetRateData } from '../model/widget-rate.model';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

@Component({
  selector: 'b3n-avg-widget',
  templateUrl: './avg-widget.component.html',
  styleUrls: ['./avg-widget.component.scss']
})
export class AvgWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;
  @Input() questionType: QuestionType;

  chartData: any;

  records: WidgetRateData[];

  readonly ChartType = ChartType;
  readonly ObjectKeys = Object.keys;
  readonly displayColumns = ['queue', 'rate'];

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

      if (this.chartData.datasets.length === 1) {
        this.records = Array.from(queueSet).map(queue => {
          const inbound = datasetMap['inbound'][queue] || {};
          const total = inbound[1] || 0;
          const answeredCall = inbound[2] / 1000 || 0;
          const rate = total > 0 ? answeredCall / total : 0;
          return <WidgetRateData>{ queue: queue, rate: isNaN(rate) ? 0 : rate };
        });
      } else {
        this.records = Array.from(queueSet).map(queue => {
          const total = datasetMap['totalCall'][queue][1] || 0;

          let rate: number;
          if (this.questionType === QuestionType.avgCallDuration) {
            const answeredCall = datasetMap['answeredCall'][queue] ? datasetMap['answeredCall'][queue][1] : 0;
            rate = total > 0 ? answeredCall / total : 0;
          } else if (this.questionType === QuestionType.avgWaitTime) {
            const sumWait = datasetMap['sumWait'][queue] ? datasetMap['sumWait'][queue][1] : 0;
            rate = total > 0 ? sumWait / total : 0;
          }
          return <WidgetRateData>{ queue: queue, rate: isNaN(rate) ? 0 : rate };
        });
      }
    }
  }
}
