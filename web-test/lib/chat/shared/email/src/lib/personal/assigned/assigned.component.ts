import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-mail-assigned',
  template: ` <b3n-email-conversation-list [convo]="conversation$ | async"></b3n-email-conversation-list>`
})
export class AssignedComponent extends EmailConversationListAbstractComponent {
  getConversations() {
    this.conversation$ = this.conversationGroupQuery.selectEmailAssignToMe().pipe(untilDestroyed(this));
  }
}
