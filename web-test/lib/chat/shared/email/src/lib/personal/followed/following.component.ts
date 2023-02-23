import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-followed',
  template: ` <b3n-email-conversation-list [convo]="conversation$ | async"></b3n-email-conversation-list>`
})
export class FollowingComponent extends EmailConversationListAbstractComponent {
  getConversations() {
    this.conversation$ = this.conversationGroupQuery.selectMyFollowingConversation().pipe(untilDestroyed(this));
  }
}
