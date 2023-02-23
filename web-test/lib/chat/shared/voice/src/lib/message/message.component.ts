import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FinishACWReq, Me as CCMe, MeQuery as CCMeQuery, TxnService } from '@b3networks/api/callcenter';
import { ChatMessage, Conversation, ConversationService, ConvoType, Status } from '@b3networks/api/workspace';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'csv-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  readonly ConvoType = ConvoType;

  acwReq = <FinishACWReq>{ code: '', note: '' };
  ccMe$: Observable<CCMe>;

  updatingStatus: boolean;

  @Input() convo: Conversation;
  @Input() message: ChatMessage;

  @Output() viewInited = new EventEmitter();

  constructor(
    private txnService: TxnService,
    private ccMeQuery: CCMeQuery,
    private convoService: ConversationService
  ) {}

  ngOnInit() {
    this.ccMe$ = this.ccMeQuery.me$;
  }

  makeDone() {
    this.updatingStatus = true;
    this.convoService
      .update(this.convo, { status: Status.closed })
      .pipe(finalize(() => (this.updatingStatus = false)))
      .subscribe();
  }

  takeCallNote() {
    if (this.convo.type !== ConvoType.call) {
      return;
    }

    const me = this.ccMeQuery.getMe();
    if (me.inAcwMode && me.assignedTxn) {
      this.acwReq.type = me.assignedTxn.type;
      this.acwReq.session = me.assignedTxn.txnUuid;

      this.txnService.finishAcw(this.acwReq).subscribe();
    }
  }

  contentInited() {
    this.viewInited.emit();
  }
}
