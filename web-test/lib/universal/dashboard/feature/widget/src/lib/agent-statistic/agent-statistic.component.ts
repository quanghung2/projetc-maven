import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Agent, AgentStatus, SystemStatusCode } from '@b3networks/api/callcenter';
import { ChartType } from '@b3networks/api/dashboard';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

class AgentStatusStat {
  total = 0;
  available = 0;
  busy = 0;
  offline = 0;
  talking = 0;
  wrapup = 0;
}

@Component({
  selector: 'b3n-agent-statistic',
  templateUrl: './agent-statistic.component.html',
  styleUrls: ['./agent-statistic.component.scss']
})
export class AgentStatisticComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  statuses = new AgentStatusStat();

  readonly ChartType = ChartType;
  readonly SystemStatusCode = SystemStatusCode;
  readonly AgentStatus = AgentStatus;

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      const agents = this.data.datasets[0].data.map(item => new Agent(item));

      this.statuses = new AgentStatusStat();
      this.statuses.total = agents.length;

      agents.forEach(r => {
        if (r.systemStatus === SystemStatusCode.talking) {
          this.statuses.talking++;
        } else if (r.systemStatus === SystemStatusCode.acw) {
          this.statuses.wrapup++;
        } else if (r.status === AgentStatus.busy) {
          this.statuses.busy++;
        } else if (r.status === AgentStatus.offline) {
          this.statuses.offline++;
        } else {
          this.statuses.available++;
        }
      });
    }
  }
}
