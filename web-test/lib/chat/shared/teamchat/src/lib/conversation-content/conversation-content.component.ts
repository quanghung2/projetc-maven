import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { ApprovalWorkspaceService } from '@b3networks/api/approval';
import { RequestLeaveQuery } from '@b3networks/api/leave';
import {
  ActiveIframeService,
  AttachmentMessageData,
  Channel,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChannelUI,
  ChatMessage,
  ChatService,
  ConfigStore,
  CopyMessageRequest,
  FilterConvoMessageRangeRequest,
  FilterConvoMessageReq,
  HistoryMessage,
  HistoryMessageQuery,
  HistoryMessageRange,
  HistoryMessageService,
  IParticipant,
  MediaService,
  MeQuery,
  MessageBody,
  MsgType,
  NameChannelPersonal,
  NetworkService,
  ReplyMessage,
  SocketStatus,
  TimeService,
  UpdateChannelReq,
  UserQuery,
  UserService,
  WindownActiveService
} from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  ChatMessageComponent,
  ConfigMessageOption,
  ConfirmInviteComponent,
  ConversationContentVirtualScrollV2Component,
  DeleteMessageComponent,
  InputConfirmInviteDialog,
  MenuMessageInfo,
  MenuMsg,
  MessageReceiveProcessor,
  PreviewHistoryMessageQuery,
  PreviewHistoryMessageService,
  RightCLickMessage,
  TxnQuery
} from '@b3networks/chat/shared/core';
import { isLocalhost, LocalStorageUtil, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { guid } from '@datorama/akita';
import { ClipboardService } from 'ngx-clipboard';
import { combineLatest, filter, Observable, of, Subject } from 'rxjs';
import { catchError, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

const PERSONAL_CHANNELS_NAME = ['bookmarks'];

@Component({
  selector: 'b3n-conversation-content',
  templateUrl: './conversation-content.component.html',
  styleUrls: ['./conversation-content.component.scss']
})
export class ConversationContentComponent
  extends ConversationContentVirtualScrollV2Component
  implements OnInit, OnDestroy
{
  configMessageOption: ConfigMessageOption = {
    useBookmark: true
  };

  channel$: Observable<Channel>;

  private _channel: Channel;
  private _id: string;
  private _loadFirst: boolean;
  private _domSelected: HTMLElement;
  private _destroyTracking$ = new Subject();

  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger: MatMenuTrigger;
  @ViewChildren(ChatMessageComponent) chatMessageComponents: QueryList<ChatMessageComponent>;

  get id(): any {
    return this._id;
  }

  get convo(): Channel {
    return this._channel;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private channelHyperspaceService: ChannelHyperspaceService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private requestLeaveQuery: RequestLeaveQuery,
    private toastService: ToastService,
    private userQuery: UserQuery,
    private userService: UserService,
    messageQuery: HistoryMessageQuery,
    messageService: HistoryMessageService,
    chatService: ChatService,
    elr: ElementRef,
    timeService: TimeService,
    messageReceiveProcessor: MessageReceiveProcessor,
    meQuery: MeQuery,
    windownActiveService: WindownActiveService,
    txnQuery: TxnQuery,
    networkService: NetworkService,
    dialog: MatDialog,
    previewHistoryMessageService: PreviewHistoryMessageService,
    previewHistoryMessageQuery: PreviewHistoryMessageQuery,
    activeIframeService: ActiveIframeService,
    approvalWorkspaceService: ApprovalWorkspaceService,
    cdr: ChangeDetectorRef,
    appService: AppService,
    appQuery: AppQuery,
    private clipboardService: ClipboardService,
    private mediaService: MediaService
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
      previewHistoryMessageService,
      previewHistoryMessageQuery,
      activeIframeService,
      approvalWorkspaceService,
      dialog,
      cdr,
      appQuery,
      appService
    );
  }

  ngOnInit(): void {
    this.chatService.socketStatus$
      .pipe(
        filter(status => status === SocketStatus.opened),
        take(1),
        takeUntil(this.destroyComponent$)
      )
      .subscribe(() => {
        this.listenActiveChannel();
        this.listenParams();
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._destroyTracking$.next(true);
    this._destroyTracking$.complete();
  }

  onFocusQuillEditor() {
    const state = this.appQuery.getValue();
    this.appService.update({
      quillEditor: {
        ...state.quillEditor,
        triggerfocus: !state.quillEditor.triggerfocus
      }
    });
  }

  addBookmarkMessage($event: ChatMessage) {
    const bookmark = this.channelQuery.getPersonalChannel(NameChannelPersonal.BOOKMARKS);
    if (!bookmark) {
      return;
    }
    this.channelService
      .copyMessage(<CopyMessageRequest>{
        srcMessage: {
          convo: $event.convo,
          id: $event.id,
          ct: $event.ct
        },
        dstConvoId: bookmark.id,
        options: {
          shouldDeduplicate: true
        }
      })
      .subscribe(
        () => this.toastService.success('Add to Bookmarks successfully'),
        err => this.toastService.error(err.error)
      );
  }

  onJumpToMessage($event: string) {
    this.channelService.updateNavigateToMsg(this._id, $event);
  }

  replyingMessage($event: ReplyMessage) {
    this.channelService.updateChannelViewState(this.id, {
      replyingMessage: $event
    });

    const state = this.appQuery.getValue();
    this.appService.update({
      quillEditor: {
        ...state.quillEditor,
        triggerfocus: !state.quillEditor.triggerfocus
      },
      triggerScrollBottomView: !state.triggerScrollBottomView
    });
  }

  removeBookmarkMessage($event: ChatMessage) {
    const msgClone = $event.extraData.linkedMessages.messageBookmark;
    if (!msgClone) {
      return;
    }
    this.channelService
      .deleteCopy(<CopyMessageRequest>{
        srcMessage: {
          convo: msgClone.convo,
          id: msgClone.id,
          ct: msgClone.ct
        },
        dstConvoId: $event.convo,
        options: {
          shouldDeduplicate: true
        }
      })
      .subscribe(
        () => this.toastService.success('Remove bookmark successfully'),
        err => this.toastService.error(err.error)
      );
  }

  // mention from edit message
  onMentionsChanged(mentions: string[]) {
    const notMembers: string[] =
      mentions.filter(m => !this._channel.participants.some(x => x.userID === m) && m !== 'everyone') || [];
    if (notMembers.length > 0) {
      const dialogRef = this.dialog.open(ConfirmInviteComponent, {
        data: <InputConfirmInviteDialog>{ members: notMembers, convo: this._channel }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const req = <UpdateChannelReq>{
            add: notMembers
          };
          this.channelService.addOrRemoveParticipants(this._channel.id, req).subscribe();
        }
      });
    }
  }

  getHistories$(id: string, req: FilterConvoMessageReq): Observable<HistoryMessage> {
    return this.messageService.getChannelHistory(id, req);
  }

  getRangeHistories$(req: FilterConvoMessageRangeRequest, config: ConfigStore): Observable<HistoryMessageRange> {
    return this.messageService.getChannelRangeHistory(req, config);
  }

  selectUiState$<K extends keyof ChannelUI>(propety?: K): Observable<ChannelUI[K]> {
    return this.channelQuery.selectUIState(this.id, propety);
  }

  selectIsDisconnected$(): Observable<boolean> {
    return this.channelQuery.isDisconnected$;
  }

  isDisconnectedStore(): boolean {
    return this.channelQuery.storeIsDisconnected();
  }

  addMsgLeaveUserDM() {
    if (this._channel?.type === ChannelType.dm && !!this._channel?.directChatUsers?.otherUuid) {
      const user = this.userQuery.getUserByChatUuid(this._channel.directChatUsers.otherUuid);
      const requestLeaveNow = this.requestLeaveQuery.getEntity(user?.identityUuid)?.requestLeaveNow;
      if (requestLeaveNow) {
        const me = this.meQuery.getMe();
        const msg = ChatMessage.createMessage(
          this._channel,
          new MessageBody({
            text: `<@${user.userUuid}> is on ${requestLeaveNow.displayText}`
          }),
          me.userUuid,
          MsgType.system
        );
        msg.id = guid();
        msg.ts = (this.messageQuery.getlastestMsg(this._channel.id)[0]?.ts || new Date().getTime()) + 1;
        this.messageService.addMessage(msg);
      }
    }
  }

  selectParticipiants$(): Observable<IParticipant[]> {
    return this.channelQuery.selectPropertyChannel(this.id, 'participants');
  }

  getUIState(id: string) {
    return this.channelQuery.getChannelUiState(id);
  }

  resetUIState(id: string) {
    return this.channelService.resetChannelViewStateHistory(id);
  }

  updateUIState(id: string, newState: Partial<any>) {
    this.channelService.updateChannelViewState(id, newState);
  }

  updateChannel(id: string, newState: Partial<Channel>) {
    this.channelService.updateChannel([<Channel>{ id, ...newState }]);
  }

  focusQuillEditorApp() {
    const state = this.appQuery.getValue();
    this.appService.update({
      quillEditor: {
        ...state.quillEditor,
        triggerfocus: !state.quillEditor.triggerfocus
      }
    });
  }

  menuClosed($event) {
    console.log($event);
    if (this._domSelected) {
      this._domSelected.style.backgroundColor = null;
    }
  }

  onRightClickMessage($event: RightCLickMessage) {
    const menu = this.elr.nativeElement.querySelector('.right-click-message-menu') as HTMLElement;
    menu.style.left = $event.xPosition + 5 + 'px';
    menu.style.top = $event.yPosition + 5 + 'px';

    if (this.matMenuTrigger) {
      // hover msg
      const dom = $event.elr.nativeElement.querySelector('.container');
      if (dom) {
        dom.style.backgroundColor = '#ececec';
        this._domSelected = dom;
      }
      this.matMenuTrigger.menuData = { item: $event };
      this.matMenuTrigger.openMenu();
    }
  }

  handleRightClick(item: RightCLickMessage, menu: MenuMessageInfo) {
    item.message = this.messageQuery.getEntity(item.message.clientId);
    switch (menu.key) {
      case MenuMsg.reply: {
        this.replyingMessage(menu.dataReply);
        break;
      }
      case MenuMsg.jumpFromBookmark: {
        const msgBM = item.message?.messageBookmark;
        if (msgBM) {
          this.router.navigate(['conversations', msgBM.convo, 'messages', msgBM.id]);
        }
        break;
      }
      case MenuMsg.jumpReply: {
        this.onJumpToMessage(item.message.messageReply?.id);
        break;
      }
      case MenuMsg.removeBookmark: {
        this.removeBookmarkMessage(item.message);
        break;
      }
      case MenuMsg.addBookmark: {
        this.addBookmarkMessage(item.message);
        break;
      }
      case MenuMsg.copyLink: {
        try {
          const origin = !isLocalhost()
            ? window.parent.location.origin + `/#/${X.orgUuid}/home`
            : window.location.origin + '/#';
          this.clipboardService.copyFromContent(
            `${origin}/conversations/${item.message.convo}/messages/${item.message.id}`
          );
          this.toastService.success('Copy link successfully!');
        } catch (error) {
          console.log('🚀 ~ error', error);
        }
        break;
      }
      case MenuMsg.editMessage: {
        const find = this.chatMessageComponents.find(x => x.message.id === item.message.id);
        if (find) {
          find.isEditing = true;
        }
        break;
      }
      case MenuMsg.deleteMessage: {
        if (item.message.metadata?.deletedAt > 0 || item.message.user !== this.meQuery.getMe().userUuid) {
          return;
        }

        this.dialog
          .open(DeleteMessageComponent, {
            width: '600px',
            data: item.message
          })
          .afterClosed()
          .subscribe(res => {
            if (res && res.isConfirm) {
              const message = ChatMessage.createDeleteMessage(item.message);
              this.chatService.send(message);

              if (item.message?.mt == MsgType.attachment) {
                const data: AttachmentMessageData = item.message.body.data?.attachment || item.message.body.data;
                if (data && data.mediaId) {
                  this.mediaService.deleteMediaFromStorage(data.mediaId, item.message.convo).subscribe();
                }
              }
            }
          });
        break;
      }

      default:
        break;
    }
  }

  private listenParams() {
    let preChannelId: string;
    combineLatest([this.route.params, this.meQuery.me$])
      .pipe(
        filter(([__, me]) => me != null),
        switchMap(([params, me]) => {
          // change channel
          if (preChannelId !== params?.['id']) {
            preChannelId = params?.['id'];
            this._loadFirst = false;
          }

          this.jumpToMessage = params?.['messageId'];

          if (!!params?.['messageId'] && this._loadFirst) {
            this.onConvoChanged();
          }

          const personal = PERSONAL_CHANNELS_NAME.find(name => name === params?.['id'])?.toUpperCase();
          let channel: Channel;
          if (personal) {
            channel = this.channelQuery.getPersonalChannel(personal.toUpperCase());
          } else {
            channel = this.channelQuery.getEntity(params?.['id']);
          }

          return channel?.type === ChannelType.dm ||
            channel?.type === ChannelType.PERSONAL ||
            (channel?.type === ChannelType.gc && channel?.isMyChannel)
            ? of(channel)
            : !!personal && !channel
            ? this.channelService.getPersonalChannels([personal]).pipe(
                switchMap(() =>
                  this.channelQuery.selectPersonalChannel(personal).pipe(
                    filter(x => x != null),
                    takeUntil(this.destroyComponent$),
                    take(1)
                  )
                )
              )
            : this.channelService.getDetails(params?.['id'], me.userUuid).pipe(
                catchError(__ => {
                  return this.channelQuery.selectGeneral().pipe(
                    filter(g => g?.length > 0),
                    map(g => g[0]),
                    take(1),
                    takeUntil(this.destroyComponent$)
                  );
                })
              );
        }),
        takeUntil(this.destroyComponent$)
      )
      .subscribe(channel => {
        if (channel != null) {
          this.channelService.updateRecentChannels(channel.id).subscribe();
          this.channelHyperspaceService.removeActive(this.channelHyperspaceQuery.getActiveId());
          this.channelService.setActive(channel.id);
          LocalStorageUtil.setItem(`lastestView_v1_${X.orgUuid}`, encodeURIComponent(this.router.url));
        } else {
          // remove
          LocalStorageUtil.removeItem(`lastestView_v1_${X.orgUuid}`);
        }
      });
  }

  private listenActiveChannel() {
    this.channel$ = this.channelQuery.selectActive().pipe(
      tap(channel => {
        this._channel = channel;

        if (channel && channel.id !== this._id) {
          this._id = channel.id;
          this._loadFirst = true;

          this.isViewLastSeen = false;
          this.configMessageOption = {
            ...this.configMessageOption,
            isBookmarkChannel: channel.isPersonalBookmark
          };
          this.onConvoChanged();

          if (channel.type === ChannelType.dm) {
            const user = this.userQuery.getUserByChatUuid(channel.directChatUsers.otherUuid);
            if (!!user && user.isTemporary) {
              this.userService.findByUuidAndUserType([user.userUuid], 'chatId').subscribe();
            }
          }

          setTimeout(() => {
            this._destroyTracking$.next(true);
            this.trackingNavigateMessage();
          }, 1000);
        }
      })
    );
  }

  private trackingNavigateMessage() {
    this.channelQuery
      .selectUIState(this.id, 'jumpMessageId')
      .pipe(
        takeUntil(this._destroyTracking$),
        filter(msgId => msgId != null)
      )
      .subscribe(msgId => {
        console.log('msgId: ', msgId);
        if (!!msgId && this._loadFirst) {
          this.jumpToMessage = msgId;
          this.onConvoChanged();
        }
      });
  }
}
