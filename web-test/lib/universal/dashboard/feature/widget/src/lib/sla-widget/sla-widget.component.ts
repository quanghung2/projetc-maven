import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartType, QuestionType } from '@b3networks/api/dashboard';
import { HashMap } from '@datorama/akita';
import { WidgetData, WidgetDataset } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

interface GeSla {
  queueUuid: string;
  queueName: string;
  total: number;
  answered: number;
  slaThreshold: string;
  sla: string;
}

class SlaRecord {
  queue: string;
  answeredThreshold: number;
  total: number;
  shortAbandoned: number;
  unansweredCallback: number;
  voicemail: number;
  rate: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (obj.noCalRate) {
      return;
    }
    const rate = this.answeredThreshold / (this.total - this.shortAbandoned - this.unansweredCallback - this.voicemail);
    this.rate = isNaN(rate) ? 0 : rate;
  }
}

@Component({
  selector: 'b3n-sla-widget',
  templateUrl: './sla-widget.component.html',
  styleUrls: ['./sla-widget.component.scss']
})
export class SlaWidgetComponent implements OnInit, OnChanges {
  @Input() type: QuestionType;
  @Input() data: WidgetData;

  chartData: any;

  geSlaRecords: GeSla[] = [];
  slaRecords: SlaRecord[];
  displayColumns = ['queue', 'total', 'answeredThreshold', 'shortAbandoned', 'unansweredCallback', 'voicemail', 'rate'];

  readonly QuestionType = QuestionType;
  readonly ChartType = ChartType;
  readonly ObjectKeys = Object.keys;

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.chartData = this.widgetTransform.buildChartData(this.data);

      if (this.type === QuestionType.geSLA) {
        console.log(this.chartData);
        let queueMapping = {};
        this.chartData.datasets.forEach(ds => {
          if (ds.id === 'queue') {
            queueMapping = ds.data.reduce((hash, obj) => {
              hash[obj[0]] = obj[1];
              return hash;
            }, {});
          }
        });

        this.geSlaRecords = [];
        const slaDS: WidgetDataset = this.chartData.datasets.find(ds => ds.id === 'sla');

        if (slaDS.data.length) {
          slaDS.data.forEach(row => {
            const queueUuid = row[0];
            const slaThreshold = queueMapping[queueUuid];

            if (slaThreshold) {
              const fieldIndex: HashMap<number> = slaDS['fieldIndex'] || {};
              const answeredIndex = fieldIndex[`answered${slaThreshold}s`];
              console.log(answeredIndex);
              const slaIndex = fieldIndex[`sla${slaThreshold}`];
              this.geSlaRecords.push(<GeSla>{
                queueName: row[fieldIndex['queueName']],
                total: row[fieldIndex['total']],
                answered: row[answeredIndex],
                slaThreshold: `${slaThreshold}s`,
                sla: row[slaIndex]
              });
            }
          });
        }

        this.geSlaRecords.sort((a, b) => a.queueName.localeCompare(b.queueName));

        this.displayColumns = ['queue', 'total', 'answered', 'threshold', 'sla'];
      } else {
        const datas: any[] = this.chartData.datasets[0].data;

        this.slaRecords = datas
          .map(data => {
            return new SlaRecord({
              queue: data[0],
              total: data[1],
              answeredThreshold: data[2],
              shortAbandoned: data[3],
              voicemail: data[4],
              unansweredCallback: data[5],
              rate: data[6],
              noCalRate: true
            });
          })
          .sort((a, b) => b.rate - a.rate);

        this.displayColumns = [
          'queue',
          'total',
          'answeredThreshold',
          'shortAbandoned',
          'unansweredCallback',
          'voicemail',
          'rate'
        ];
      }
    }
  }
}
