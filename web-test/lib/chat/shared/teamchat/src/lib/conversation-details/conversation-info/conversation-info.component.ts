import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Channel, User, UserQuery } from '@b3networks/api/workspace';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-conversation-info',
  templateUrl: './conversation-info.component.html',
  styleUrls: ['./conversation-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationInfoComponent implements OnInit, OnChanges {
  @Input() convo: Channel;

  user$: Observable<User>;

  private convoId: string;

  constructor(private userQuery: UserQuery) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['convo'] && this.convoId !== this.convo.id) {
      this.convoId = this.convo.id;

      const uuid = this.convo.isGroupChat ? this.convo.createdBy : this.convo.directChatUsers.otherUuid;
      this.user$ = this.userQuery.selectUserByChatUuid(uuid);
    }
  }
}
