import { Agent } from '@b3networks/api/callcenter';
import { EventMessage } from '@b3networks/shared/utils/message';

export class AgentChangedEvent implements EventMessage {
  agent: Agent;
  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class AgentStatusChanged extends AgentChangedEvent {
  constructor(obj?: any) {
    super(obj);
    Object.assign(this, obj);
  }
}

export class AgentLicenseChangedEvent extends AgentChangedEvent {
  constructor(obj?: any) {
    super(obj);
    Object.assign(this, obj);
  }
}
