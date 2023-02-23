import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ActiveIframeService,
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelHyperspaceUI,
  ChannelType,
  ChannelUI,
  ChatMessage,
  ChatService,
  HistoryMessageQuery,
  Hyperspace,
  IdleService,
  MeQuery,
  MessageBody,
  MsgType,
  RequestNamespacesHyper,
  ReqUpdateUsersChannelHyper,
  RoleUserHyperspace,
  SystemMessageData,
  SystemMsgType,
  TimeService,
  TypingState,
  User,
  UserQuery,
  ViewUIStateCommon,
  WindownActiveService,
  WsState
} from '@b3networks/api/workspace';
import {
  ConfirmInviteHyperspaceComponent,
  CshQuillEditorComponent,
  InputConfirmInviteHyperspaceDialog,
  MessageConstants,
  OutputContentQuill,
  QuillEditorInput
} from '@b3networks/chat/shared/core';
import { arrayCompare, deltaHasContent, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { DeltaStatic } from 'quill';
import { Observable, timer } from 'rxjs';
import { filter, map, share, take, takeUntil } from 'rxjs/operators';

const SEND_TYPING_TIME = 3 * 1000;

@Component({
  selector: 'b3n-hyperspace-footer',
  templateUrl: './hyperspace-footer.component.html',
  styleUrls: ['./hyperspace-footer.component.scss']
})
export class HyperspaceFooterComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  private _id: string;

  convoName: string;

  quillEditorData: QuillEditorInput = <QuillEditorInput>{
    enableMention: true,
    enableEmoji: true,
    enableUpload: true,
    showSendButton: true
  };

  archivedBy$: Observable<User>;
  userTypings$: Observable<TypingState[]>;

  @Input() channel: ChannelHyperspace;
  @Input() hyper: Hyperspace;

  @Output() uploadedFiles = new EventEmitter<File[]>();

  @ViewChild(CshQuillEditorComponent) quillEditorComponent: CshQuillEditorComponent;

  constructor(
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private chatService: ChatService,
    private messageQuery: HistoryMessageQuery,
    private timeService: TimeService,
    private idleService: IdleService,
    private dialog: MatDialog,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private toastService: ToastService,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService
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

      this.userTypings$ = this.channelHyperspaceQuery.selectUIState(this._id, 'userTypings').pipe(
        map(x => x || []),
        map(userTypings => this.getValidTypingUsers(userTypings))
      );

      const context = this.channelHyperspaceQuery.getChannelUiState(this._id)?.draftMsg;
      this.quillEditorData = {
        ...this.quillEditorData,
        context,
        placeholder: this.getChannelPlaceholder(this.channel)
      };

      this.archivedBy$ = this.channelHyperspaceQuery.selectPropertyChannel(this._id, 'archivedBy').pipe(
        filter(x => x != null),
        map(
          archivedBy => this.userQuery.getEntity(archivedBy) // identity Uuid
        )
      );
    }
  }

  handleEnterMessage(data: OutputContentQuill) {
    const me = this.meQuery.getMe();
    const message = ChatMessage.createMessage(
      this.channel,
      new MessageBody({ text: data?.msg }),
      me.userUuid,
      MsgType.message
    );
    const sent = this.chatService.send(message);
    if (sent) {
      const uiState = this.channelHyperspaceQuery.getChannelUiState(this.channel.id);
      if (uiState.lastSeenMsgID) {
        // scroll bottom
        this.channelHyperspaceService.updateChannelViewState(this.channel.id, <ChannelHyperspaceUI>{
          lastSeenMsgID: undefined
        });
      }
      if (data?.mentions?.length > 0 && this.channel.isGroupChat) {
        this.checkUserMention(data);
      }
    }
  }

  onUploadFile(files: File[]) {
    this.uploadedFiles.emit(files);
  }

  joinConvo() {
    const me = this.meQuery.getMe();
    if (me) {
      const req = <ReqUpdateUsersChannelHyper>{
        hyperspaceId: this.channel.hyperspaceId,
        hyperchannelId: this.channel.id,
        add: [
          <RequestNamespacesHyper>{
            namespaceId: X.orgUuid,
            users: [
              {
                id: this.meQuery.getMe().userUuid,
                role: RoleUserHyperspace.member
              }
            ]
          }
        ]
      };
      this.channelHyperspaceService.updateUsersChannelHyper(req).subscribe();
    }
  }

  showTypingUsers(userTypings: TypingState[]) {
    return userTypings?.length > 0 ? 'visible' : 'hidden';
  }

  onTextChanged(draftMessage: DeltaStatic) {
    const text = deltaHasContent(draftMessage) ? draftMessage : null;
    this.channelHyperspaceService.updateChannelViewState(this.channel.id, <ViewUIStateCommon>{
      draftMsg: text
    });
  }

  handleEditLastMessage($event) {
    const me = this.meQuery.getMe();
    const lastestMessage = this.messageQuery.getlastestMsgByUser(this.channel.id, me.userUuid)[0];
    if (lastestMessage && this.timeService.nowInMillis() - lastestMessage.ts < MessageConstants.TIMEOUT) {
      this.channelHyperspaceService.updateChannelViewState(this.channel.id, <ChannelHyperspaceUI>{
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
      data.mentions.filter(m => !this.channel.allMembers.some(x => x.userID === m) && m !== 'everyone') || [];
    if (notMembers.length > 0) {
      const dialogRef = this.dialog.open(ConfirmInviteHyperspaceComponent, {
        data: <InputConfirmInviteHyperspaceDialog>{
          members: notMembers,
          convo: this.channel,
          hyperspace: this.hyper
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const req = <ReqUpdateUsersChannelHyper>{
            hyperspaceId: this.channel.hyperspaceId,
            hyperchannelId: this.channel.id,
            add: []
          };
          const members = notMembers.map(x => this.hyper.allMembers.find(u => u.userUuid === x)).filter(x => !!x);
          const memberCurrentOrg = members.filter(x => x.isCurrentOrg);
          if (memberCurrentOrg.length > 0) {
            req.add.push(<RequestNamespacesHyper>{
              namespaceId: memberCurrentOrg[0].orgUuid,
              users: memberCurrentOrg.map(u => ({
                id: u.userUuid,
                role: RoleUserHyperspace.member
              }))
            });
          }

          const memberOtherOrg = members.filter(x => !x.isCurrentOrg);
          if (memberOtherOrg.length > 0) {
            req.add.push(<RequestNamespacesHyper>{
              namespaceId: memberOtherOrg[0].orgUuid,
              users: memberOtherOrg.map(u => ({
                id: u.userUuid,
                role: RoleUserHyperspace.member
              }))
            });
          }

          this.channelHyperspaceService.updateUsersChannelHyper(req).subscribe(
            res => {
              this.toastService.success('Invite member successfully!');
            },
            error => {
              this.toastService.error(error.message || 'Invite member failed!');
            }
          );
        }
      });
    }
  }

  private trackingRemoveUserTyping() {
    timer(SEND_TYPING_TIME, SEND_TYPING_TIME)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe)
      )
      .subscribe(_ => {
        const userTyping = this.channelHyperspaceQuery.getChannelUiState(this.channel.id)?.userTypings || [];
        const validTyping = this.getValidTypingUsers(userTyping);
        if (!arrayCompare(userTyping, validTyping)) {
          this.channelHyperspaceService.updateChannelViewState(this.channel.id, <ChannelUI>{
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
            this.idleService.idleStatus === WsState.active &&
            this.windownActiveService.windowActiveStatus &&
            this.activeIframeService.isMyIframe
        ),
        share()
      )
      .subscribe(_ => {
        const draftMessage = this.channelHyperspaceQuery.getChannelUiState(this.channel.id).draftMsg;
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

  private getChannelPlaceholder(convo: ChannelHyperspace) {
    let placeholder: string;
    switch (convo.type) {
      case ChannelType.dm:
        this.userQuery
          .selectUserByChatUuid(convo.directChatUsers.otherUuid)
          .pipe(
            takeUntil(this.destroySubscriber$),
            filter(u => u != null),
            take(1)
          )
          .subscribe(user => {
            this.convoName = user.displayName;
            placeholder = `Message to @${this.convoName}`;
          });
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
