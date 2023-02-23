import { Component, Input, OnInit } from '@angular/core';
import {
  ChatMessage,
  Conversation,
  FilterConvoMessageReq,
  HistoryMessageQuery,
  HistoryMessageService
} from '@b3networks/api/workspace';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const DEFAULT_LIMIT = 50;

@Component({
  selector: 'csv-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements OnInit {
  private _convo$: Observable<Conversation>;
  @Input('convo$') set convo$(convo$: Observable<Conversation>) {
    this._convo$ = convo$.pipe(
      tap(convo => {
        this.convoId = convo.conversationUuid;
        this.messages$ = this.messageQuery.selectAllByConversation(convo.conversationUuid);

        this.messageService
          .getV2(convo.conversationUuid, <FilterConvoMessageReq>{
            limit: DEFAULT_LIMIT
          })
          .subscribe(_ => {});
      })
    );
  }
  get convo$() {
    return this._convo$;
  }

  convoId: string;
  messages$: Observable<ChatMessage[]>;
  loading$: Observable<boolean>;

  constructor(private messageQuery: HistoryMessageQuery, private messageService: HistoryMessageService) {}

  ngOnInit() {
    this.loading$ = this.messageQuery.isLoading$;
  }
}
