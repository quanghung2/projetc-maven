import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType, QuestionType } from '@b3networks/api/dashboard';
import { ChartData } from 'chart.js';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

interface GEInboundStatistic {
  incomingTotal: number;
  incomingAnswered: number;
  incomingCallback: number;
  incomingOverflow: number;
  incomingAbandoned: number;
}

interface GECallbackStatistic {
  callbackTotal: number;
  callbackAgentAnswered: number;
  callbackRejoined: number;
  callbackCustomerUnanswered: number;
  callbackAgentUnanswered: number;
  callbackexpired: number;
}

class NormalStatistic {
  totalCall = 0;
  incomingAnswered = 0;
  callbackAnswered = 0;
  abandoned = 0;
  callbackUnanswered = 0;
  overflow = 0;
  voicemail = 0;
  activeCall = 0;

  get answered() {
    const value = this.incomingAnswered + this.callbackAnswered;
    return isNaN(value) ? 0 : value;
  }
}

@Component({
  selector: 'b3n-call-statistic',
  templateUrl: './call-statistic.component.html',
  styleUrls: ['./call-statistic.component.scss']
})
export class CallStatisticComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;
  @Input() type: QuestionType;

  chartData: ChartData;

  geInboundStatistic: GEInboundStatistic;
  geCallbackStatistic: GECallbackStatistic;
  statistic: NormalStatistic;

  readonly ChartType = ChartType;
  readonly QuestionType = QuestionType;

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.chartData = this.widgetTransform.buildChartData(this.data);

      if (this.type === QuestionType.geInboundStatistic) {
        this.geInboundStatistic = <GEInboundStatistic>{};
        this.chartData.datasets.forEach(dataset => {
          this.geInboundStatistic.incomingTotal = +dataset.data[0] || 0;
          this.geInboundStatistic.incomingAnswered = +dataset.data[1] || 0;
          this.geInboundStatistic.incomingCallback = +dataset.data[2] || 0;
          this.geInboundStatistic.incomingOverflow = +dataset.data[3] || 0;
          this.geInboundStatistic.incomingAbandoned = +dataset.data[4] || 0;
        });
      } else if (this.type === QuestionType.geCallbackStatistic) {
        this.geCallbackStatistic = <GECallbackStatistic>{};
        this.chartData.datasets.forEach(dataset => {
          this.geCallbackStatistic.callbackTotal = +dataset.data[0] || 0;
          this.geCallbackStatistic.callbackAgentAnswered = +dataset.data[1] || 0;
          this.geCallbackStatistic.callbackRejoined = +dataset.data[2] || 0;
          this.geCallbackStatistic.callbackCustomerUnanswered = +dataset.data[3] || 0;
          this.geCallbackStatistic.callbackAgentUnanswered = +dataset.data[4] || 0;
          this.geCallbackStatistic.callbackexpired = +dataset.data[5] || 0;
        });
      } else {
        this.statistic = new NormalStatistic();
        this.chartData.datasets.forEach(dataset => {
          const id = dataset['id'];
          if (id === 'inbound') {
            this.statistic.totalCall = +dataset.data[0];
            this.statistic.incomingAnswered = +dataset.data[1];
            this.statistic.abandoned = +dataset.data[2];
            this.statistic.voicemail = +dataset.data[3];
            this.statistic.totalCall = +dataset.data[0];
          } else if (id === 'callback') {
            this.statistic.callbackAnswered = +dataset.data[0];
            this.statistic.callbackUnanswered = +dataset.data[1];
          } else if (id === 'activeTxn') {
            this.statistic.activeCall = +dataset.data[0];
          }
        });
      }
    }
  }
}
