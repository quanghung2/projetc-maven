import { AgentConfig, AgentId } from '../agent/agent-config';
import { EventLog } from '../txn/model/txn-event-log';
import { CampaignInfo } from './campaign';

export class CampaignTxn {
  campaignUuid: string;
  campaign: CampaignInfo;

  txnUuid: string;
  number: string;
  correctedNumber: string;
  agentId: AgentId;
  agent: AgentConfig;

  code: string;
  note: string;
  customerInfo: any;
  eventLogs: EventLog[];
  status: string | TxnStatusCampaign;
  startedAt: string;
  endedAt: string;

  constructor(obj?: Partial<CampaignTxn>) {
    if (obj) {
      Object.assign(this, obj);
      this.eventLogs = obj?.eventLogs.map(x => new EventLog(x)) || [];
    }
  }

  get agentSkip() {
    const agentSkip = this.eventLogs.find(x => x.action === 'skip');
    if (agentSkip) {
      return `- ${agentSkip.name}`;
    }
    return '- Unknown';
  }

  public applyCampaign(campaigns: CampaignInfo[]) {
    if (this.campaignUuid) {
      this.campaign = campaigns.find(a => a.uuid === this.campaignUuid);
    }

    return this;
  }
}

export enum TxnStatusCampaign {
  agentSkip = 'agentSkip',
  hangupBySupervisor = 'hangupBySupervisor'
}
