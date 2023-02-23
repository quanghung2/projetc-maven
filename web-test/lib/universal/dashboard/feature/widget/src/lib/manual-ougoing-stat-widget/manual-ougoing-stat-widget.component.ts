import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType } from '@b3networks/api/dashboard';
import { ChartData } from 'chart.js';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

export class CallStatisticModel {
  totalCall: number;
  answered: number;
  unanswered: number;
  busy: number;
  failed: number;
}

@Component({
  selector: 'b3n-manual-ougoing-stat-widget',
  templateUrl: './manual-ougoing-stat-widget.component.html',
  styleUrls: ['./manual-ougoing-stat-widget.component.scss']
})
export class ManualOugoingStatWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  chartData: ChartData;
  statistic: CallStatisticModel;

  readonly ChartType = ChartType;

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.chartData = this.widgetTransform.buildChartData(this.data);

      this.statistic = new CallStatisticModel();
      this.chartData.datasets.forEach(dataset => {
        const id = dataset['id'];
        this.statistic[id] = dataset.data[0] || 0;
      });
    }
  }
}
