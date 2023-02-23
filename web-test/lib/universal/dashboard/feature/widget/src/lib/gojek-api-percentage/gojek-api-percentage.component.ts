import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType } from '@b3networks/api/dashboard';
import { ChartData } from 'chart.js';
import { WidgetData } from '../..';
import { WidgetTransformService } from '../service/widget-transform.service';

interface ApiPercentageData {
  connectSuccessPercent: number | string;
  callStatusSuccessPercent: string | number;
}

@Component({
  selector: 'b3n-gojek-api-percentage',
  templateUrl: './gojek-api-percentage.component.html',
  styleUrls: ['./gojek-api-percentage.component.scss']
})
export class GojekApiPercentageComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  chartData: ChartData;
  statistic: ApiPercentageData;

  readonly ChartType = ChartType;

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      console.log(this.data);

      this.chartData = this.widgetTransform.buildChartData(this.data);
      this.statistic = <ApiPercentageData>{
        connectSuccessPercent: 'N/A',
        callStatusSuccessPercent: 'N/A'
      };

      this.chartData.datasets.forEach(dataset => {
        const id = dataset['id'];
        if (id === 'api') {
          if (dataset.data.length) {
            const success = (dataset.data as [])
              .filter(d => d[0] === '200')
              .map(d => d[1])
              .reduce((a, b) => a + b, 0);
            const total = (dataset.data as []).map(d => d[1]).reduce((a, b) => a + b, 0);
            this.statistic.connectSuccessPercent = total > 0 ? success / total : 'N/A';
          }
        } else if (id === 'callStatus') {
          const success = (dataset.data as [])
            .filter(d => d[0] === '200')
            .map(d => d[1])
            .reduce((a, b) => a + b, 0);
          const total = (dataset.data as []).map(d => d[1]).reduce((a, b) => a + b, 0);
          this.statistic.callStatusSuccessPercent = total > 0 ? success / total : 'N/A';
        }
      });
    }
  }
}
