import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Agent, AgentStatus, SystemStatusCode } from '@b3networks/api/callcenter';
import { ChartType } from '@b3networks/api/dashboard';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';

@Component({
  selector: 'b3n-agents-status',
  templateUrl: './agents-status.component.html',
  styleUrls: ['./agents-status.component.scss']
})
export class AgentsStatusComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  agents: Agent[];

  readonly ChartType = ChartType;
  readonly SystemStatusCode = SystemStatusCode;
  readonly AgentStatus = AgentStatus;

  constructor(private widgetTransform: WidgetTransformService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.agents = this.data.datasets[0].data.map(item => new Agent(item));
    }
  }
}
