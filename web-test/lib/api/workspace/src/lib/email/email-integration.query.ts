import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { EmailInbox } from './email-integration.model';
import { EmailIntegrationStore, EmailState } from './email-integration.store';

@Injectable({ providedIn: 'root' })
export class EmailIntegrationQuery extends Query<EmailState> {
  tags$ = this.select('tags');
  signatures$ = this.select('signatures');
  inboxes$ = this.select('inboxes');
  exceptionInboxUuids$ = this.select('exceptionInboxUuids');
  agentInboxes$ = this.select('agentInboxes');
  schedules$ = this.select('schedules');
  agentNotification$ = this.select('agentNotification');
  rules$ = this.select('rules');
  loading$ = this.selectLoading();

  constructor(protected override store: EmailIntegrationStore) {
    super(store);
  }

  getExceptionInboxUuids() {
    return this.getValue()?.exceptionInboxUuids || [];
  }

  getInboxBelongToAgent(): EmailInbox[] {
    const inboxes = this.getValue().inboxes;
    const agentInboxes = this.getValue().agentInboxes;
    if (agentInboxes.length) {
      return inboxes.filter(x => agentInboxes.findIndex(y => y.inboxUuid === x.uuid) >= 0);
    } else {
      return inboxes;
    }
  }
}
