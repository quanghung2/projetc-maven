import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { AgentStatus } from '@b3networks/api/callcenter';
import { WidgetData } from '../model/widget.model';
import {
  AgentBusyDurationBreakdown,
  AgentLatestStatus,
  AgentLogin,
  AgentPerformance
} from './nec-agent-performance-widget.model';

type finalAgent = AgentLatestStatus & AgentPerformance & AgentBusyDurationBreakdown & AgentLogin;

@Component({
  selector: 'b3n-nec-agent-performance-widget',
  templateUrl: './nec-agent-performance-widget.component.html',
  styleUrls: ['./nec-agent-performance-widget.component.scss']
})
export class NecAgentPerformanceWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  agentStatus = AgentStatus;
  lstAgentLatestStatus: AgentLatestStatus[];
  lstAgentPerformance: AgentPerformance[];
  lstAgentBusyDurationBreakdown: AgentBusyDurationBreakdown[];
  lstAgentLogin: AgentLogin[];
  finalAgents: Partial<finalAgent>[];
  displayedColumns = [
    { key: 'extensionLabel', value: 'Agent' },
    { key: 'status', value: 'Status' },
    { key: 'queuesCount', value: 'Total Queues' },
    { key: 'loginDuration', value: 'Login Duration' },
    { key: 'callsOffered', value: 'Call Offered' },
    { key: 'callsAnswered', value: 'Call Answered' },
    { key: 'callsUnanswered', value: 'Call Unanswered' },
    { key: 'busyMeal', value: 'Meals' },
    { key: 'busyToilet', value: 'Toilet' },
    { key: 'busyMeeting', value: 'Meeting' },
    { key: 'busyTraining', value: 'Training' },
    { key: 'busyRemote', value: 'Remote' },
    { key: 'busyEmail', value: 'Email' },
    { key: 'busyLogin', value: 'Login' },
    { key: 'firstLoginTime', value: 'First Login' },
    { key: 'lastLoginTime', value: 'Last Login' }
  ];
  columnsProps: string[] = this.displayedColumns.map(column => column.key);

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges() {
    const [agentLatestStatus, agentPerformance, agentBusyDurationBreakdown, agentLogin] = this.data.datasets;
    [this.lstAgentLatestStatus, this.lstAgentPerformance, this.lstAgentBusyDurationBreakdown, this.lstAgentLogin] = [
      agentLatestStatus.data,
      agentPerformance.data,
      agentBusyDurationBreakdown.data,
      agentLogin.data
    ];

    this.finalAgents = [
      ...this.lstAgentLatestStatus,
      ...this.lstAgentPerformance,
      ...this.lstAgentBusyDurationBreakdown,
      ...this.lstAgentLogin
    ];

    this.finalAgents = this.finalAgents
      .reduce((prev, curr) => {
        if (!curr.agentUuid) {
          return prev;
        }

        if (curr.loginDuration) {
          const [hour, minute, second] = curr.loginDuration.split(':');
          curr.loginDuration = `${hour}h ${minute}m ${second}s`;
        }

        if (curr.firstLoginTime) {
          curr.firstLoginTime = curr.firstLoginTime.split(':').join('h');
        }

        if (curr.lastLoginTime) {
          curr.lastLoginTime = curr.lastLoginTime.split(':').join('h');
        }

        const agent = prev.find(p => p?.agentUuid === curr.agentUuid);
        const index = prev.findIndex(p => p?.agentUuid === curr.agentUuid);

        if (!agent) {
          prev.push(curr);
        } else {
          // confirm that data wont be duplicated
          const newAgent = { ...agent, ...curr };
          prev.splice(index, 1, newAgent);
        }

        return prev;
      }, [] as Partial<finalAgent>[])
      .filter(a => !!a.extensionLabel);
  }
}
