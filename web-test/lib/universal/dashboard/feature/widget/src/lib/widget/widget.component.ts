import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { ChartType, FilterData, QuestionType } from '@b3networks/api/dashboard';
import { X } from '@b3networks/shared/common';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import 'chartjs-plugin-colorschemes';
import * as _ from 'lodash';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

@Component({
  selector: 'b3n-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: WidgetData;
  @ViewChild('chart') chartRef: ElementRef;
  @Input() filter: FilterData;
  @Input() type: QuestionType;

  chart: Chart;
  chartData: ChartData;
  readonly ChartType = ChartType;
  organization: ProfileOrg;

  ttlCheck = {
    hasTtl: false,
    index: 0
  };

  constructor(private widgetTransform: WidgetTransformService, private profileQuery: IdentityProfileQuery) {
    this.profileQuery.selectProfileOrg(X.orgUuid).subscribe(org => {
      this.organization = org;
    });
  }

  ngOnInit() {}

  checkTtl() {
    this.ttlCheck.hasTtl = !!this.data.datasets[0].data.find(d => !!d.ttl);

    if (this.ttlCheck.hasTtl) {
      this.ttlCheck.index = Object.keys(this.data.datasets[0].data[0]).findIndex(d => d === 'ttl');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.chartData = this.widgetTransform.buildChartData(this.data);
      const currentValue = changes['data'].currentValue && changes['data'].currentValue.datasets;
      const previousValue = changes['data'].previousValue && changes['data'].previousValue.datasets;
      if (this.filter && !this.isArrayEqual(currentValue, previousValue)) {
        this.initChart();
      }
      this.checkTtl();
    }
  }

  isArrayEqual(currentValue: [], previousValue: []) {
    return _(currentValue).differenceWith(previousValue, _.isEqual).isEmpty();
  }

  isLineOrBarChart() {
    return this.data.datasets[0].chartType === ChartType.line || this.data.datasets[0].chartType === ChartType.bar;
  }

  initChart() {
    const type = this.data.datasets[0].chartType;
    let options: ChartOptions;
    if (this.isLineOrBarChart()) {
      options = {
        scales: {
          xAxes: [{ gridLines: { display: false }, ticks: { fontStyle: 'bold' } }],
          yAxes: [
            { ticks: { beginAtZero: true, padding: 10, fontStyle: 'bold' }, gridLines: { drawOnChartArea: false } }
          ]
        },
        animation: { duration: 500 },
        plugins: {
          colorschemes: {
            scheme: 'brewer.DarkTwo8'
          }
        }
      };
    } else {
      options = {
        scales: {},
        animation: { duration: 500 },
        tooltips: {
          callbacks: {
            label: function (item, data) {
              return `${data.labels[item.index]}  ${data.datasets[item.datasetIndex].label}: ${
                data.datasets[item.datasetIndex].data[item.index]
              }`;
            }
          }
        }
      };
    }

    if (this.chartRef) {
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = new Chart(this.chartRef.nativeElement, {
        type: type,
        data: this.chartData,
        options: options
      });

      if (this.chart && this.chart.config.data.labels.length === 0) {
        this.chartRef.nativeElement.classList.add('hide');
      } else {
        this.chartRef.nativeElement.classList.remove('hide');
      }
    }
  }

  ngAfterViewInit() {
    this.initChart();
  }
}
