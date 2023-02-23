import { AgentStatus } from '@b3networks/api/callcenter';

export interface QueuePerformance {
  answeredCalls: string;
  queueName: string;
  abandonedCallPercentage: string;
  abandonedAlertThreshold: string;
  totalValidCalls: string;
  abandonedCalls: string;
  answeredCallPercentage: string;
  queueUuid: string;
  callInQueue: number;
  highlight: boolean;
}

export interface CurrentCallInQueue {
  state: string;
  agentUuid: string;
  queueUuid: string;
}

export interface AgentLatestStatus {
  lastUpdated: number;
  extensionLabel: string;
  actorRole: string;
  queueUuids: string[];
  remark: string;
  extensionKey: string;
  agentUuid: string;
  status: AgentStatus;
}
