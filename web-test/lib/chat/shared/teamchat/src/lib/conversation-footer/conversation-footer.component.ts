import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApprovalWorkspaceService } from '@b3networks/api/approval';
import {
  ActiveIframeService,
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChannelUI,
  ChatMessage,
  ChatService,
  ExtraData,
  HistoryMessageQuery,
  IdleService,
  Integration,
  IntegrationQuery,
  LinkedMessages,
  MeQuery,
  MessageBody,
  MsgType,
  ReplyMessage,
  SystemMessageData,
  SystemMsgType,
  TimeService,
  TypingState,
  UpdateChannelReq,
  User,
  UserQuery,
  ViewUIStateCommon,
  WindownActiveService,
  WsState
} from '@b3networks/api/workspace';
import {
  AppQuery,
  APPROVAL_BOT_NAME,
  AppService,
  ConfirmInviteComponent,
  CshQuillEditorComponent,
  InputConfirmInviteDialog,
  MessageConstants,
  OutputContentQuill,
  QuillEditorInput
} from '@b3networks/chat/shared/core';
import { arrayCompare, deltaHasContent, DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { DeltaStatic } from 'quill';
import { Observable, of, timer } from 'rxjs';
import { filter, finalize, map, share, switchMap, takeUntil } from 'rxjs/operators';

const SEND_TYPING_TIME = 3 * 1000;

@Component({
  selector: 'b3n-conversation-footer',
  templateUrl: './conversation-footer.component.html',
  styleUrls: ['./conversation-footer.component.scss']
})
export class ConversationFooterComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  private _id: string;

  convoName: string;

  quillEditorData: QuillEditorInput = <QuillEditorInput>{
    enableMention: true,
    enableEmoji: true,
    enableUpload: true,
    showSendButton: true
  };
  isStarting: boolean;

  archivedBy$: Observable<User>;
  userTypings$: Observable<TypingState[]>;
  isApprovalBot$: Observable<boolean>;
  replyingMessage$: Observable<ReplyMessage>;

  @Input() channel: Channel;

  @Output() uploadedFiles = new EventEmitter<File[]>();

  @ViewChild(CshQuillEditorComponent) quillEditorComponent: CshQuillEditorComponent;

  constructor(
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private integrationQuery: IntegrationQuery,
    private chatService: ChatService,
    private messageQuery: HistoryMessageQuery,
    private timeService: TimeService,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private idleService: IdleService,
    private dialog: MatDialog,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService,
    private approvalWorkspaceService: ApprovalWorkspaceService,
    private toastService: ToastService,
    private appQuery: AppQuery,
    private appService: AppService
  ) {
    super();
  }

  ngOnInit() {
    this.trackingSendTyping();
    this.trackingRemoveUserTyping();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['channel'] && this.channel != null && this.channel.id !== this._id) {
      this._id = this.channel.id;

      this.isApprovalBot$ =
        this.channel.type === ChannelType.dm
          ? this.integrationQuery
              .selectAllByChatUuid(this.channel?.directChatUsers?.otherUuid)
              .pipe(
                switchMap(integration =>
                  integration?.name === APPROVAL_BOT_NAME
                    ? this.integrationQuery.approvalBot$.pipe(
                        map(msChatid => msChatid === this.channel?.directChatUsers?.otherUuid)
                      )
                    : of(null)
                )
              )
          : of(null);

      this.userTypings$ = this.channelQuery.selectUIState(this._id, 'userTypings').pipe(
        map(x => x || []),
        map(userTypings => this.getValidTypingUsers(userTypings))
      );

      const context = this.channelQuery.getChannelUiState(this._id)?.draftMsg;
      this.quillEditorData = {
        ...this.quillEditorData,
        context,
        placeholder: this.getChannelPlaceholder(this.channel)
      };

      this.replyingMessage$ = this.channelQuery.selectUIState(this._id, 'replyingMessage');
      this.archivedBy$ = this.channelQuery.selectPropertyChannel(this._id, 'archivedBy').pipe(
        filter(x => x != null),
        map(
          archivedBy => this.userQuery.getEntity(archivedBy) // identity Uuid
        )
      );
    }
  }

  removeReply() {
    this.channelService.updateChannelViewState(this._id, {
      replyingMessage: null
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

  handleEnterMessage(data: OutputContentQuill) {
    const me = this.meQuery.getMe();
    const message = ChatMessage.createMessage(
      this.channel,
      new MessageBody({ text: data?.msg }),
      me.userUuid,
      MsgType.message
    );

    const replyMsg = this.channelQuery.getChannelUiState(this.channel.id)?.replyingMessage;
    if (replyMsg) {
      if (replyMsg?.message?.extraData) {
        delete replyMsg.message.extraData;
      }
      if (replyMsg?.message?.metadata) {
        delete replyMsg.message.metadata;
      }
      message.extraData = new ExtraData({
        ...message.extraData,
        linkedMessages: new LinkedMessages(<LinkedMessages>{
          ...message.extraData?.linkedMessages,
          replyTo: replyMsg?.message?.id
        }).addMsgToSnapshots(replyMsg?.message)
      });
    }

    const sent = this.chatService.send(message);
    if (sent) {
      const uiState1 = this.channelQuery.getChannelUiState(this.channel.id);
      const updateUI = <ChannelUI>{};
      if (uiState1.lastSeenMsgID) {
        // scroll bottom
        updateUI.lastSeenMsgID = undefined;
      }
      if (replyMsg) {
        updateUI.replyingMessage = undefined;
      }
      this.channelService.updateChannelViewState(this.channel.id, updateUI);

      if (replyMsg) {
        // trigger scroll bottom
        const state = this.appQuery.getValue();
        this.appService.update({
          triggerScrollBottomView: !state.triggerScrollBottomView
        });
      }

      if (data?.mentions?.length > 0 && this.channel.isGroupChat && !this.channel.isGeneral) {
        this.checkUserMention(data);
      }
    }
  }

  onUploadFile(files: File[]) {
    this.uploadedFiles.emit(files);
  }

  newRequest() {
    this.isStarting = true;
    this.approvalWorkspaceService
      .start()
      .pipe(finalize(() => (this.isStarting = false)))
      .subscribe({ error: err => this.toastService.error(err.message) });
  }

  joinConvo() {
    const me = this.meQuery.getMe();
    if (me) {
      const req = <UpdateChannelReq>{
        add: [me.userUuid]
      };
      this.channelService.addOrRemoveParticipants(this.channel.id, req).subscribe();
    }
  }

  showTypingUsers(userTypings: TypingState[]) {
    return userTypings?.length > 0 ? 'visible' : 'hidden';
  }

  onTextChanged(draftMessage: DeltaStatic) {
    const text = deltaHasContent(draftMessage) ? draftMessage : null;
    this.channelService.updateChannelViewState(this.channel.id, <ViewUIStateCommon>{
      draftMsg: text
    });
  }

  handleEditLastMessage($event: any) {
    const me = this.meQuery.getMe();
    const lastestMessage = this.messageQuery.getlastestMsgByUser(this.channel.id, me.userUuid)[0];
    if (lastestMessage && this.timeService.nowInMillis() - lastestMessage.ts < MessageConstants.TIMEOUT) {
      this.channelService.updateChannelViewState(this.channel.id, <ChannelUI>{
        editingMessageId: lastestMessage.clientId
      });
    }
  }

  getTime(date?: Date) {
    if (date) {
      return new Date(date).getTime();
    }

    return new Date().getTime();
  }

  private getValidTypingUsers(userTypings: TypingState[]) {
    return userTypings?.filter(
      (s: TypingState) => s.startAtMillis + MessageConstants.TYPING > this.timeService.nowInMillis()
    );
  }

  private checkUserMention(data: OutputContentQuill) {
    const notMembers: string[] =
      data.mentions.filter(m => !this.channel.participants.some(x => x.userID === m) && m !== 'everyone') || [];
    if (notMembers.length > 0) {
      const dialogRef = this.dialog.open(ConfirmInviteComponent, {
        data: <InputConfirmInviteDialog>{ members: notMembers, convo: this.channel }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const req = <UpdateChannelReq>{
            add: notMembers
          };
          this.channelService.addOrRemoveParticipants(this.channel.id, req).subscribe();
        }
      });
    }
  }

  private trackingRemoveUserTyping() {
    timer(SEND_TYPING_TIME, SEND_TYPING_TIME)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(_ => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe)
      )
      .subscribe(_ => {
        const userTyping = this.channelQuery.getChannelUiState(this.channel.id)?.userTypings || [];
        const validTyping = this.getValidTypingUsers(userTyping);
        if (!arrayCompare(userTyping, validTyping)) {
          this.channelService.updateChannelViewState(this.channel.id, <ChannelUI>{
            userTypings: validTyping
          });
        }
      });
  }

  private trackingSendTyping() {
    timer(SEND_TYPING_TIME, SEND_TYPING_TIME)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(
          _ =>
            this.channel &&
            this.idleService.idleStatus === WsState.active &&
            this.windownActiveService.windowActiveStatus &&
            this.activeIframeService.isMyIframe
        ),
        share()
      )
      .subscribe(_ => {
        const draftMessage = this.channelQuery.getChannelUiState(this.channel.id).draftMsg;
        if (deltaHasContent(draftMessage)) {
          const body = new MessageBody({
            text: '',
            title: '',
            data: <SystemMessageData>{
              text: '',
              type: SystemMsgType.typing
            }
          });

          const me = this.meQuery.getMe();
          const message = ChatMessage.createMessage(this.channel, body, me.userUuid, MsgType.system).markIsNoStore();
          this.chatService.send(message);
        }
      });
  }

  private getChannelPlaceholder(convo: Channel) {
    let placeholder: string;
    switch (convo.type) {
      case ChannelType.dm:
        let user: User | Integration = this.integrationQuery.getBotByChatUuid(convo.directChatUsers.otherUuid);
        if (!user) {
          user = this.userQuery.getUserByChatUuid(convo.directChatUsers.otherUuid);
        }
        this.convoName = user.displayName;
        placeholder = `Message to @${this.convoName}`;
        break;
      case ChannelType.gc:
        this.convoName = convo.name;
        placeholder = `Message to #${this.convoName}`;
        break;
      default:
        this.convoName = convo.name;
        placeholder = `Message to ${this.convoName}`;
        break;
    }
    return placeholder;
  }
}
