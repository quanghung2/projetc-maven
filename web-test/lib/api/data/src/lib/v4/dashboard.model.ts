export interface InboundDashboard {
  queueUuid: string;
  queueName: string;

  answeredCalls: number;
  avgTalkDuration: number;
  avgQueueDuration: number;
  abandonedCalls: number;
  abandonedRate: number;
  shortAbandoned: number;
  longAbandoned: number;
  longestQueueDuration: number;
  unansweredCallbackCalls: number;
  voicemail: number;
  totalCalls: number;

  answeredInThreshold5s: number;
  answeredInThreshold10s: number;
  answeredInThreshold15s: number;
  answeredInThreshold20s: number;
  answeredInThreshold30s: number;
  answeredInThreshold45s: number;
  answeredInThreshold60s: number;
  answeredInThreshold90s: number;

  currentCallsInQueue: number;

  sla5s: number;
  sla10s: number;
  sla15s: number;
  sla20s: number;
  sla30s: number;
  sla45s: number;
  sla60s: number;
  sla90s: number;

  dateTime: number;
}
