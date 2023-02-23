import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { DashboardV2Service, QuestionV2 } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { GoogleCharts } from 'google-charts';
import * as moment from 'moment';
import { takeUntil, tap } from 'rxjs/operators';
import { WidgetData } from '../../model/widget.model';

@Component({
  selector: 'b3n-call-center-line-widget',
  templateUrl: './call-center-line-widget.component.html',
  styleUrls: ['./call-center-line-widget.component.scss']
})
export class CallCenterLineWidgetComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() questionV2: QuestionV2;
  @Input() data: WidgetData;
  @Input() cardContentHeight: number;

  chart: any;
  chartData: any;
  options: any;
  afterInit: boolean;
  hasQueueFilter: boolean;
  includeNonQueueFilterHash: boolean;
  queueUuids: string[];
  chartDataRows = [];
  queues: QueueInfo[] = [];

  constructor(private queueService: QueueService, private dashboardV2Service: DashboardV2Service) {
    super();
  }

  async ngOnInit() {
    this.queues = await this.queueService.getQueuesFromCache().toPromise();

    this.handleQueueFilter();
    this.initData();

    GoogleCharts.load(
      () => {
        this.chart = new GoogleCharts.api.visualization.LineChart(document.getElementById(this.questionV2.uuid));
        this.initChartData();
        this.drawChart();
      },
      {
        packages: ['corechart']
      }
    );

    this.afterInit = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.afterInit || !changes['data']) {
      return;
    }

    this.clearData();
    this.initData();

    if (this.chartDataRows.length) {
      this.initChartData();
      this.drawChart();
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

    const hash = (this.data.datasets[0].data as any).data;
    const keys = Object.keys(hash);

    this.chartDataRows = [];

    keys.forEach(key => {
      const queueDataHash = hash[key] as any[];
      const queueUuids = Object.keys(queueDataHash);
      const row: any[] = [
        moment(key, 'YYYY-MM-DDTHH:mm:ssZ').toDate(),
        ...new Array(this.queueUuids.length).fill(null)
      ];

      queueUuids.forEach(queueUuid => {
        const queueIndex = this.queueUuids.findIndex(uuid => uuid === queueUuid) + 1;
        const waitTime = +queueDataHash[queueUuid] > 0 ? Math.ceil(+queueDataHash[queueUuid] / 1000) : null;

        row.splice(queueIndex, 1, waitTime);
      });

      this.chartDataRows.push(row);
    });
  }

  initChartData() {
    this.chartData = new GoogleCharts.api.visualization.DataTable();
    this.chartData.addColumn('date', 'Day');

    this.queueUuids.forEach(queueUuid => {
      const queue = this.queues.find(q => q.uuid === queueUuid);
      this.chartData.addColumn('number', queue ? queue.label : 'Unknown');
    });

    this.chartData.addRows(this.chartDataRows);
  }

  drawChart() {
    this.options = {
      curveType: 'function',
      legend: { position: 'bottom' },
      width: '100%',
      height: this.cardContentHeight,
      backgroundColor: '#fafafa',
      series: {
        0: { targetAxisIndex: 0 }
      },
      vAxes: {
        0: {
          title: 'Second',
          titleTextStyle: {
            italic: false,
            bold: true,
            color: 'rgb(117, 117, 117)'
          }
        }
      },
      theme: 'material',
      interpolateNulls: true,
      chartArea: { width: '80%' },
      vAxis: {
        viewWindow: {
          min: 0
        }
      },
      pointSize: 5
    };

    if (window.innerWidth >= 3840 && window.innerHeight >= 2160) {
      const fontSizeFor49inch = 42;

      this.options = {
        ...this.options,
        legend: {
          position: 'bottom',
          textStyle: {
            fontSize: fontSizeFor49inch
          }
        },
        vAxes: {
          0: {
            title: 'Second',
            titleTextStyle: {
              italic: false,
              bold: true,
              color: 'rgb(117, 117, 117)',
              fontSize: fontSizeFor49inch
            }
          },
          textStyle: {
            fontSize: fontSizeFor49inch
          }
        },
        vAxis: {
          titleTextStyle: {
            fontSize: fontSizeFor49inch
          },
          textStyle: {
            fontSize: fontSizeFor49inch
          },
          viewWindow: {
            min: 0
          }
        },
        hAxis: {
          titleTextStyle: {
            fontSize: fontSizeFor49inch
          },
          textStyle: {
            fontSize: fontSizeFor49inch
          }
        },
        pointSize: 15,
        tooltip: {
          textStyle: {
            fontSize: fontSizeFor49inch
          }
        }
      };
    }

    this.chart.draw(this.chartData, this.options);
  }
}
