import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ConversationGroup, ConversationGroupQuery } from '@b3networks/api/workspace';
import { UNKNOWN_USER } from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'csl-conversation-header',
  templateUrl: './conversation-header.component.html',
  styleUrls: ['./conversation-header.component.scss']
})
export class ConversationHeaderComponent implements OnInit, OnChanges {
  readonly UNKNOWN_USER = UNKNOWN_USER;
  viewDate$: Observable<number>;

  @Input() ticket: ConversationGroup;

  constructor(private convoGroupQuery: ConversationGroupQuery) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket']) {
      this.viewDate$ = this.convoGroupQuery.selectUIState(this.ticket.conversationGroupId, 'viewDate');
    }
  }
}
