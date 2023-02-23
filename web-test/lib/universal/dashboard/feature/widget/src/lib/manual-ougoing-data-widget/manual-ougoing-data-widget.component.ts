import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType } from '@b3networks/api/dashboard';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

class ManualOutgoingData {
  time: string;
  totalCall: number;
  answered: number;
  unanswered: number;
  busy: number;
  failed: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

@Component({
  selector: 'b3n-manual-ougoing-data-widget',
  templateUrl: './manual-ougoing-data-widget.component.html',
  styleUrls: ['./manual-ougoing-data-widget.component.scss']
})
export class ManualOugoingDataWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  chartData: any;

  records: ManualOutgoingData[];

  readonly ChartType = ChartType;
  readonly ObjectKeys = Object.keys;
  readonly displayColumns = ['time', 'totalCall', 'answered', 'unanswered', 'busy', 'failed'];

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.chartData = this.widgetTransform.buildChartData(this.data);

      const timeSet = new Set<string>();
      const datasetMap: any = {};

      this.chartData.datasets.forEach(dataset => {
        const id = dataset['id'];

        const timeMapping = {};
        dataset.data.forEach((row: any[]) => {
          timeSet.add(row[0]);
          timeMapping[row[0]] = row[1];
        });

        datasetMap[id] = timeMapping;
      });

      this.records = Array.from(timeSet).map(time => {
        return new ManualOutgoingData({
          time: time,
          totalCall: datasetMap['totalCall'][time] || 0,
          answered: datasetMap['answered'][time] || 0,
          unanswered: datasetMap['unanswered'][time] || 0,
          busy: datasetMap['busy'][time] || 0,
          failed: datasetMap['failed'][time] || 0
        });
      });
    }
  }
}
