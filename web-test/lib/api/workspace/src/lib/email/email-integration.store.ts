import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import {
  AgentInbox,
  AgentNotification,
  EmailInbox,
  EmailRule,
  EmailSchedule,
  EmailSignature,
  EmailTag
} from './email-integration.model';

export interface EmailState {
  loaded: boolean; // is init app
  signatures: EmailSignature[];
  tags: EmailTag[];
  inboxes: EmailInbox[];
  exceptionInboxUuids: string[];
  agentInboxes: AgentInbox[];
  rules: EmailRule[];
  agentNotification: AgentNotification;
  schedules: EmailSchedule[];
}

function createInitialState(): EmailState {
  return <EmailState>{
    loaded: false,
    signatures: [],
    tags: [],
    inboxes: [],
    exceptionInboxUuids: [],
    agentInboxes: [],
    rules: [],
    agentNotification: {},
    schedules: null
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_email_integration' })
export class EmailIntegrationStore extends Store<EmailState> {
  constructor() {
    super(createInitialState());
  }
}
