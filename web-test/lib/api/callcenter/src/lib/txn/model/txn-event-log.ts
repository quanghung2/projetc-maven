import { AgentId } from '../../agent/agent-config';

export class EventLog {
  timestamp: number;
  formattedTimestamp: string;
  action: string;
  type: string;
  id: AgentId;
  name: string;
  status: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get actionDisplay(): string {
    if (this.action === 'assignedBySystem') {
      return 'is assgined by system';
    } else if (this.action === 'dialedBySystem') {
      return 'is dialed by system';
    } else if (this.action === 'answered') {
      return 'pickup';
    } else if (this.action === 'skip') {
      return 'skip the call';
    } else if (this.action === 'ended') {
      return 'hangup';
    } else if (this.action === 'markCallDone') {
      return 'mark the call done';
    } else if (this.action === 'selectVoiceMail') {
      return 'select leaving voice mail';
    }

    return this.action;
  }
}
