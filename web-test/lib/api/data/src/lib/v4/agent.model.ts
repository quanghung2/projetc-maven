export class AgentReport {
  type: string;
  time: string;
  queueUuid: string;
  queueName: string;
  agentUuid: string;
  agent: string;
  status: string;
  totalTalkDuration: string;
  maxTalkDuration: string;
  answered: string;
  unanswered: string;
  assigned: string;

  constructor(obj?: Partial<AgentReport>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
