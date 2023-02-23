import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelUI,
  ChatService,
  FilterConvoMessageReq,
  HistoryMessage,
  HistoryMessageQuery,
  HistoryMessageService,
  Hyperspace,
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
  TxnQuery
} from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-hyperspace-content',
  templateUrl: './hyperspace-content.component.html',
  styleUrls: ['./hyperspace-content.component.scss']
})
export class HyperspaceContentComponent extends ConversationContentVirtualScrollComponent implements OnInit, OnChanges {
  private _id: string;

  @Input() channel: ChannelHyperspace;
  @Input() hyper: Hyperspace;

  constructor(
    messageQuery: HistoryMessageQuery,
    messageService: HistoryMessageService,
    chatService: ChatService,
    public override elr: ElementRef,
    timeService: TimeService,
    messageReceiveProcessor: MessageReceiveProcessor,
    meQuery: MeQuery,
    windownActiveService: WindownActiveService,
    txnQuery: TxnQuery,
    networkService: NetworkService,
    dialog: MatDialog,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
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

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['channel'] && this.channel && this.channel.id !== this._id) {
      this._id = this.channel.id;
      this.onConvoChanged();
    }
  }

  get id(): any {
    return this._id;
  }

  get convo(): ChannelHyperspace {
    return this.channel;
  }

  // mention from edit message
  onMentionsChanged(mentions: string[]) {
    // const notMembers: string[] =
    //   mentions.filter(m => !this.channel.participants.some(x => x.userID === m) && m !== 'everyone') || [];
    // if (notMembers.length > 0) {
    //   const dialogRef = this.dialog.open(ConfirmInviteComponent, {
    //     data: <InputConfirmInviteDialog>{ members: notMembers, convo: this.channel }
    //   });
    //   dialogRef.afterClosed().subscribe(result => {
    //     if (result) {
    //       const req = <UpdateChannelReq>{
    //         add: notMembers
    //       };
    //       this.channelService.addOrRemoveParticipants(this.channel.id, req).subscribe();
    //     }
    //   });
    // }
  }

  getHistories$(id: string, req: FilterConvoMessageReq): Observable<HistoryMessage> {
    return this.messageService.getChannelHyperHistory(id, req);
  }

  selectUiState$<K extends keyof ChannelUI>(propety?: K): Observable<ChannelUI[K]> {
    return this.channelHyperspaceQuery.selectUIState(this.id, propety);
  }

  selectIsDisconnected$(): Observable<boolean> {
    return this.channelHyperspaceQuery.isDisconnected$;
  }

  isDisconnectedStore(): boolean {
    return this.channelHyperspaceQuery.storeIsDisconnected();
  }

  addMsgLeaveUserDM() {}

  selectParticipiants$(): Observable<IParticipant[]> {
    return this.channelHyperspaceQuery.selectParticipantChannel(this.id);
  }

  getUIState(id: string) {
    return this.channelHyperspaceQuery.getChannelUiState(id);
  }

  resetUIState(id: string) {
    return this.channelHyperspaceService.resetChannelViewStateHistory(id);
  }

  updateUIState(id: string, newState: Partial<any>) {
    this.channelHyperspaceService.updateChannelViewState(id, newState);
  }
}
