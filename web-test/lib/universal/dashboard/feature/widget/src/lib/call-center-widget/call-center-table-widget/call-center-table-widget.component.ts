import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ConfigTableV2, DashboardV2Service, QuestionV2 } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { GoogleCharts } from 'google-charts';
import { takeUntil, tap } from 'rxjs/operators';
import { WidgetData } from '../../model/widget.model';

@Component({
  selector: 'b3n-call-center-table-widget',
  templateUrl: './call-center-table-widget.component.html',
  styleUrls: ['./call-center-table-widget.component.scss']
})
export class CallCenterTableWidgetComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() questionV2: QuestionV2;
  @Input() data: WidgetData;
  @Input() cardContentHeight: number;

  hasQueueFilter: boolean;
  includeNonQueueFilterHash: boolean;
  queueUuids: string[];
  chart: any;
  chartData: any;
  options: any;
  afterInit: boolean;
  singleMetric: boolean;
  singleMetricData: number;

  constructor(private dashboardV2Service: DashboardV2Service) {
    super();
  }

  ngOnInit() {
    this.singleMetric = !!this.questionV2.question.source.singleMetric;

    if (!this.singleMetric) {
      this.options = {
        showRowNumber: false,
        allowHtml: true,
        height: this.cardContentHeight,
        width: '100%',
        sort: 'disable',
        cssClassNames: {
          tableCell: 'table-cell',
          headerCell: 'header-cell'
        }
      };

      this.handleQueueFilter();

      GoogleCharts.load(
        () => {
          this.chart = new GoogleCharts.api.visualization.Table(document.getElementById(this.questionV2.uuid));
          this.initChart();
        },
        {
          packages: ['table']
        }
      );
    } else {
      this.singleMetricData = this.initDataSingleMetric();
    }

    this.afterInit = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.afterInit || !changes['data']) {
      return;
    }

    if (!this.singleMetric) {
      this.clearData();
      this.initChart();
    } else {
      this.singleMetricData = this.initDataSingleMetric();
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
    this.chartData = null;
    this.chart?.clearChart();
  }

  initDataSingleMetric() {
    if (!this.data || !this.data.datasets.length || !this.data.datasets[0].data) {
      return;
    }

    const { columnOrder, rows } = this.data.datasets[0].data as any;

    if (!rows?.length || !columnOrder?.length) {
      return;
    }

    return rows[0][columnOrder[0]];
  }

  initChart() {
    if (!this.data || !this.data.datasets.length || !this.data.datasets[0].data) {
      return;
    }

    const { columnOrder, rows } = this.data.datasets[0].data as any;

    if (!columnOrder?.length || !rows?.length) {
      return;
    }

    this.chartData = new GoogleCharts.api.visualization.DataTable();

    columnOrder.forEach(column => {
      this.chartData.addColumn('string', column);
    });

    this.chartData.addRows(rows.length);

    const columnMap = {};
    const rowMap = {};
    const config = this.questionV2.config as ConfigTableV2;

    config?.column?.forEach(c => {
      columnMap[c.name] = c;
    });

    config?.row?.forEach(r => {
      rowMap[r.column] = r;
    });

    rows.forEach((row, rowI) => {
      columnOrder.forEach((column, columnI) => {
        if (columnMap[column] && columnMap[column].condition.match === row[column]) {
          for (let i = 0; i < this.chartData.getNumberOfColumns(); i++) {
            this.chartData.setProperty(rowI, i, 'style', `background-color:${rowMap[column].format.backgroundColor};`);
          }

          this.chartData.setCell(rowI, columnI, row[column], null, {
            style: `
              color: ${columnMap[column].format.textColor}; 
              font-weight: ${columnMap[column].format.textStyle};
              background-color: ${rowMap[column].format.backgroundColor};
            `
          });
        } else {
          this.chartData.setCell(rowI, columnI, row[column], null);
        }
      });
    });

    this.chart.draw(this.chartData, this.options);
  }
}
