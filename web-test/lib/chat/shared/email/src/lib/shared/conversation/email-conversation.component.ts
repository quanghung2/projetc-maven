import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ConversationGroup, User } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-email-conversation',
  templateUrl: './email-conversation.component.html',
  styleUrls: ['./email-conversation.component.scss']
})
export class EmailConversationComponent {
  conversationGroup: ConversationGroup = new ConversationGroup();
  @Input() set convo(convo: ConversationGroup) {
    this.conversationGroup = convo;
  }
  @Input() me: User;
  @Input() showAction: boolean;
  @Input() isDraft: boolean;
  @Output() selectActionEmitter: EventEmitter<{
    checked: boolean;
    checkedConvo: ConversationGroup;
  }> = new EventEmitter();

  constructor() {}

  onChangeCheckbox($event: MatCheckboxChange, convo: ConversationGroup) {
    this.selectActionEmitter.emit({
      checked: $event.checked,
      checkedConvo: convo
    });
  }

  get lastMessageAsMillisecond(): number {
    return this.conversationGroup.isEmailConversationHasDraft(this.me.identityUuid)
      ? new Date(this.conversationGroup.draft.updatedAt).getTime()
      : new Date(this.conversationGroup.lastMessage).getTime();
  }
}
