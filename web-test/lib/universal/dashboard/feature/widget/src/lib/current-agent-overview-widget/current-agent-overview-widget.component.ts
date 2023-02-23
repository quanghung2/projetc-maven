import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { WidgetData } from '../model/widget.model';

export interface AgentLatestStatus {
  lastUpdated: string;
  extensionLabel: string;
  actorRole: string;
  remark: string;
  extensionKey: string;
  agentUuid: string;
  status: AgentStatus;
  queueUuids: string[];
}

export interface CurrentTalkingCall {
  state: string;
  agentUuid: string;
  queueUuid: string;
}

export enum AgentStatus {
  available = 'available',
  busy = 'busy',
  offline = 'offline',
  away = 'away',
  disabled = 'disabled',
  enabled = 'enabled'
}

@Component({
  selector: 'b3n-current-agent-overview-widget',
  templateUrl: './current-agent-overview-widget.component.html',
  styleUrls: ['./current-agent-overview-widget.component.scss']
})
export class CurrentAgentOverviewWidgetComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: WidgetData;

  AgentStatus = AgentStatus;
  agents: AgentLatestStatus[];
  calls: CurrentTalkingCall[];
  times = [
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnChanges() {
    if (!this.data?.datasets?.length) {
      return;
    }

    const [agents, calls] = this.data.datasets;
    [this.agents, this.calls] = [agents.data, calls.data];
  }

  isTalking(agentUuid: string) {
    return !!this.calls.find(c => c.agentUuid === agentUuid);
  }
}
