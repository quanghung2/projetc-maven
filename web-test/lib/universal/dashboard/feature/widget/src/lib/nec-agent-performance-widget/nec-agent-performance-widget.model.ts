import { AgentStatus } from '@b3networks/api/callcenter';

export interface AgentLatestStatus {
  lastUpdated: string;
  extensionLabel: string;
  remark: string;
  extensionKey: string;
  agentUuid: string;
  status: AgentStatus;
}

export interface AgentPerformance {
  callsUnanswered: string;
  callsAnswered: string;
  callsOffered: string;
  loginDuration: string;
  agentUuid: string;
  queuesCount: string;
}

export interface AgentBusyDurationBreakdown {
  busyEmail: string;
  busyRemote: string;
  busyTraining: string;
  busyLogin: string;
  busyToilet: string;
  busyMeeting: string;
  busyMeal: string;
  agentUuid: string;
}

export interface AgentLogin {
  lastLoginTime: string;
  firstLoginTime: string;
  agentUuid: string;
}
