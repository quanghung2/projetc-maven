import { Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Channel,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  FilterConvoMessageReq,
  HistoryMessage,
  HistoryMessageQuery,
  HistoryMessageService,
  IParticipant,
  MeQuery,
  NetworkService,
  TimeService,
  WindownActiveService
} from '@b3networks/api/workspace';
import {
  AppService,
  ConversationContentVirtualScrollComponent,
  MessageReceiveProcessor,
  TxnQuery,
  TxnService
} from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'csw-conversation-content',
  templateUrl: './conversation-content.component.html',
  styleUrls: ['./conversation-content.component.scss']
})
export class ConversationContentComponent extends ConversationContentVirtualScrollComponent implements OnChanges {
  private _id: string;

  @Input() ticket: ConversationGroup;

  constructor(
    messageQuery: HistoryMessageQuery,
    messageService: HistoryMessageService,
    chatService: ChatService,
    public override elr: ElementRef,
    timeService: TimeService,
    messageReceiveProcessor: MessageReceiveProcessor,
    meQuery: MeQuery,
    windownActiveService: WindownActiveService,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private txnService: TxnService,
    txnQuery: TxnQuery,
    networkService: NetworkService,
    dialog: MatDialog,
    appService: AppService
  ) {
    super(
      messageQuery,
      messageService,
      chatService,
      elr,
      timeService,
      messageReceiveProcessor,
      meQuery,
      windownActiveService,
      txnQuery,
      networkService,
      dialog,
      appService
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket'] && this.ticket && this.ticket.conversationGroupId !== this._id) {
      this._id = this.ticket.conversationGroupId;
      this.onConvoChanged();
    }
  }

  get id(): any {
    return this._id;
  }

  get convo(): Channel | ConversationGroup {
    return this.ticket;
  }

  getHistories$(id: string, req: FilterConvoMessageReq): Observable<HistoryMessage> {
    const me = this.meQuery.getMe();
    const isMember = this.ticket.members?.findIndex(x => x.chatUserUuid === me.userUuid) > -1;
    if (isMember) {
      return this.messageService.getWhatsappHistory(id, req);
    }

    return this.txnService.join(id).pipe(switchMap(_ => this.messageService.getWhatsappHistory(id, req)));
  }

  selectUiState$<K extends keyof ConversationGroupUI>(propety?: K): Observable<ConversationGroupUI[K]> {
    return this.convoGroupQuery.selectUIState(this.id, propety);
  }

  selectIsDisconnected$(): Observable<boolean> {
    return this.convoGroupQuery.isDisconnected$;
  }

  isDisconnectedStore(): boolean {
    return this.convoGroupQuery.storeIsDisconnected();
  }

  addMsgLeaveUserDM() {}

  selectParticipiants$(): Observable<IParticipant[]> {
    return this.convoGroupQuery
      .selectPropertyChannel(this.id, 'members')
      .pipe(map(members => members.map(m => <IParticipant>{ userID: m.chatUserUuid })));
  }

  getUIState(id: string) {
    return this.convoGroupQuery.getConvoUiState(id);
  }

  resetUIState(id: string) {
    return this.convoGroupService.resetChannelViewStateHistory(id);
  }

  updateUIState(id: string, newState: Partial<any>) {
    this.convoGroupService.updateConvoViewState(id, newState);
  }
}
