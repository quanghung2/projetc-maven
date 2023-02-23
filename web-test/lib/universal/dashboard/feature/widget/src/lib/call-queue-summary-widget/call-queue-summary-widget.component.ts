import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AgentStatus } from '@b3networks/api/callcenter';
import { WidgetData } from '../model/widget.model';
import { AgentLatestStatus, CurrentCallInQueue, QueuePerformance } from './call-queue-summary-widget.model';

@Component({
  selector: 'b3n-call-queue-summary-widget',
  templateUrl: './call-queue-summary-widget.component.html',
  styleUrls: ['./call-queue-summary-widget.component.scss']
})
export class CallQueueSummaryWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;

  lstQueuePerformance: QueuePerformance[];
  lstCurrentCallInQueue: CurrentCallInQueue[];
  lstAgentLatestStatus: AgentLatestStatus[];

  displayedColumns = [
    { key: 'queueName', value: 'Queue' },
    { key: 'callInQueue', value: 'Calls in Queue' },
    { key: 'availableAgent', value: 'Available Agents' },
    { key: 'answeredCallPercentage', value: 'Answered Calls %' },
    { key: 'abandonedCallPercentage', value: 'Abandoned Calls %' },
    { key: 'totalValidCalls', value: 'Total Valid Calls' },
    { key: 'answeredCalls', value: 'Answered Calls' },
    { key: 'abandonedCalls', value: 'Abandoned Calls' }
  ];
  columnsProps: string[] = this.displayedColumns.map(column => column.key);

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    const [queuePerformance, currentCallInQueue, agentLatestStatus] = this.data.datasets;
    /**3**/ this.lstAgentLatestStatus = agentLatestStatus.data;
    /**2**/ this.lstCurrentCallInQueue = currentCallInQueue.data;
    /**1**/ this.lstQueuePerformance = queuePerformance.data
      .map((q: QueuePerformance) => {
        const callInQueue = this.lstCurrentCallInQueue.filter(l => l.queueUuid === q.queueUuid).length;
        const abandonedCallPercentage = parseInt(q.abandonedCallPercentage.split('%')[0], 10);
        const availableAgents = this.lstAgentLatestStatus.filter(
          l => l.queueUuids.includes(q.queueUuid) && l.status === AgentStatus.available
        );

        return {
          ...q,
          callInQueue,
          availableAgent: availableAgents.length,
          highlight: abandonedCallPercentage >= parseInt(q.abandonedAlertThreshold, 10)
        };
      })
      .sort((a, b) => a.queueName.localeCompare(b.queueName));
  }
}
