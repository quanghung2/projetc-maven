import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DashboardV2Service, QuestionV2 } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { GoogleCharts } from 'google-charts';
import { takeUntil, tap } from 'rxjs/operators';
import { WidgetData } from '../../model/widget.model';

@Component({
  selector: 'b3n-call-center-pie-widget',
  templateUrl: './call-center-pie-widget.component.html',
  styleUrls: ['./call-center-pie-widget.component.scss']
})
export class CallCenterPieWidgetComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() questionV2: QuestionV2;
  @Input() data: WidgetData;
  @Input() cardContentHeight: number;

  chartDataRows = [];
  othersSliceValues = [];
  colors = [];
  afterInit: boolean;
  chart: any;
  chartData: any;
  options: any = {};
  hasQueueFilter: boolean;
  includeNonQueueFilterHash: boolean;
  queueUuids: string[];
  sum: number;

  constructor(private dashboardV2Service: DashboardV2Service) {
    super();
  }

  ngOnInit(): void {
    this.handleQueueFilter();
    this.initData();

    if (this.chartDataRows.length) {
      GoogleCharts.load(
        () => {
          this.chart = new GoogleCharts.api.visualization.PieChart(document.getElementById(this.questionV2.uuid));
          this.initChartData();
          this.drawChart();
        },
        {
          packages: ['corechart']
        }
      );
    }

    this.afterInit = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.afterInit || !changes['data']) {
      return;
    }

    this.clearData();
    this.initData();

    if (this.chartDataRows.length) {
      this.options.colors = this.colors;

      GoogleCharts.load(
        () => {
          this.chart = new GoogleCharts.api.visualization.PieChart(document.getElementById(this.questionV2.uuid));
          this.initChartData();
          this.drawChart();
        },
        {
          packages: ['corechart']
        }
      );
    }
  }

  handleQueueFilter() {
    this.dashboardV2Service.queueFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(queueFilterHash => {
          this.hasQueueFilter = queueFilterHash[this.questionV2.uuid];
        })
      )
      .subscribe();

    this.dashboardV2Service.queueUuids$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(uuids => {
          this.queueUuids = uuids;

          if (this.hasQueueFilter && !this.queueUuids?.length) {
            this.clearData();
          }
        })
      )
      .subscribe();

    this.dashboardV2Service.includeNonQueueFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(includeNonQueueFilterHash => {
          this.includeNonQueueFilterHash = includeNonQueueFilterHash[this.questionV2.uuid];
        })
      )
      .subscribe();
  }

  clearData() {
    this.chartDataRows = [];
    this.othersSliceValues = [];
    this.colors = [];
    this.sum = 0;
    this.chart?.clearChart();
  }

  initData() {
    if (
      !this.data ||
      !this.data.datasets.length ||
      !this.data.datasets[0].data ||
      !(this.data.datasets[0].data as any).data
    ) {
      return;
    }

    const data = (this.data.datasets[0].data as any).data;
    const keys = Object.keys(data);

    if (!keys.length) {
      return;
    }

    const values: number[] = Object.values(data);
    this.sum = values.reduce((prev, curr) => +prev + +curr, 0);

    keys.forEach(key => {
      const value = data[key];
      const percent = +((value * 100) / this.sum).toFixed(2);
      const fieldInfo = this.questionV2.config[key];
      const displayText = (fieldInfo?.displayText ?? key.charAt(0).toUpperCase() + key.slice(1)) + ` (${data[key]})`;

      if (percent <= 2) {
        this.othersSliceValues.push(`${displayText}: ${percent}%`);
      }
    });

    keys.forEach(label => {
      const fieldInfo = this.questionV2.config[label];
      const color = fieldInfo?.color;
      const displayText =
        (fieldInfo?.displayText ?? label.charAt(0).toUpperCase() + label.slice(1)) +
        ` (${data[label].toLocaleString()})`;

      this.colors.push(color ?? this.getRandomColor());
      this.chartDataRows.push([displayText, data[label]]);
    });
  }

  initChartData() {
    this.chartData = new GoogleCharts.api.visualization.DataTable();
    this.chartData.addColumn('string', 'label');
    this.chartData.addColumn('number', 'data');
    this.chartData.addRows(this.chartDataRows);
  }

  drawChart() {
    this.options = {
      backgroundColor: 'transparent',
      colors: this.colors,
      pieSliceText: 'none',
      sliceVisibilityThreshold: 0.02,
      pieResidueSliceLabel: 'Others',
      pieResidueSliceColor: '#97A0AF',
      chartArea: {
        width: '100%',
        height: '100%'
      },
      legend: {
        position: 'labeled',
        textStyle: {
          fontSize: 14,
          bold: true
        }
      },
      enableInteractivity: false
    };

    this.chart.draw(this.chartData, this.options);
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
  }
}
