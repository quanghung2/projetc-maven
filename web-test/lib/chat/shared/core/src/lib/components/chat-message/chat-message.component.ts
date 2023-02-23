import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AttachmentMessageData,
  ChannelQuery,
  ChatMessage,
  ChatService,
  ConfigStore,
  ConversationGroupQuery,
  ConvoType,
  FilterConvoMessageRangeRequest,
  HistoryMessageQuery,
  HistoryMessageService,
  HyperspaceQuery,
  IMessBodyData,
  Integration,
  IntegrationQuery,
  MediaService,
  MeQuery,
  MessageBody,
  MsgType,
  ReplyMessage,
  SystemType,
  TimeService,
  User,
  UserQuery,
  UserType
} from '@b3networks/api/workspace';
import { isLocalhost, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { differenceInMinutes } from 'date-fns';
import { ClipboardService } from 'ngx-clipboard';
import { firstValueFrom, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, take, takeUntil, tap } from 'rxjs/operators';
import { UNKNOWN_USER } from '../../core/constant/common.const';
import { MessageConstants } from '../../core/constant/message.const';
import { InfoShowMention, MenuMessageInfo, MenuMsg, RightCLickMessage } from '../../core/state/app-state.model';
import { DeleteMessageComponent } from './delete-message/delete-message.component';

enum MessagePosition {
  first,
  middle
}

export interface ConfigMessageOption {
  isHideAction?: boolean; // in delete mode, preview msg not use action
  noHoverAffect?: boolean; // hover message
  fullDate?: boolean;
  useBookmark?: boolean;
  isBookmarkChannel?: boolean;
}

@Component({
  selector: 'csh-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent implements OnDestroy, OnChanges {
  @HostBinding('class') clazz = 'csh-chat-message';

  @Input() message: ChatMessage;
  @Input() previousMessage: ChatMessage | null; // dont remove null , trigger onChange to update position render msg and fetch info user
  @Input() editingMessageId: string;
  @Input() parentElr?: HTMLElement; // use intersection to lazy loading image;
  @Input() configMessageOption: ConfigMessageOption = {
    isHideAction: false,
    noHoverAffect: false,
    fullDate: false,
    useBookmark: false,
    isBookmarkChannel: false
  };

  @Output() edited = new EventEmitter<boolean>();
  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();
  @Output() mentionsChanged = new EventEmitter<string[]>();
  @Output() addBookmarkMessage = new EventEmitter<ChatMessage>();
  @Output() removeBookmarkMessage = new EventEmitter<ChatMessage>();
  @Output() replyingMessage = new EventEmitter<ReplyMessage>();
  @Output() jumpToMessage = new EventEmitter<string>();
  @Output() rightClickMessage = new EventEmitter<RightCLickMessage>();

  readonly ConvoType = ConvoType;
  readonly UserType = UserType;
  readonly MessagePosition = MessagePosition;
  readonly MessageConstants = MessageConstants;
  readonly MsgType = MsgType;

  messageRender: ChatMessage;
  user$: Observable<User | Integration>;
  user: User | Integration;
  nameConvo$: Observable<string>;
  nameConvo: string;
  position: MessagePosition = MessagePosition.first;
  positionAction: string;
  msgReply: ChatMessage;

  isInteractiveV2: boolean;
  isEditing = false;
  isDeletedMessage: boolean;
  allowUseAction = false;
  allowUseReplyAction = false;
  isAllowUseBookmark = false;
  withinLimit: boolean;
  isExpand: boolean;
  canJumpChannel: boolean;
  isShowingMenu: boolean;

  private _preUser: string;
  private _isShowmore: boolean;
  private _backupMessage: ChatMessage; // of this.message
  private _destroyTimer$ = new Subject();

  constructor(
    private dialog: MatDialog,
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private integrationQuery: IntegrationQuery,
    private convoGroupQuery: ConversationGroupQuery,
    private channelQuery: ChannelQuery,
    private chatService: ChatService,
    private timeService: TimeService,
    private hyperspaceQuery: HyperspaceQuery,
    private router: Router,
    private clipboardService: ClipboardService,
    private toastService: ToastService,
    private historyMessageService: HistoryMessageService,
    private historyMessageQuery: HistoryMessageQuery,
    private mediaService: MediaService,
    private elr: ElementRef
  ) {}

  ngOnDestroy(): void {
    this._destroyTimer$.next(true);
    this._destroyTimer$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.msgReply = this.message?.messageReply;
      this.initMessage();
    }

    if (changes['editingMessageId'] && !this.configMessageOption.isBookmarkChannel) {
      if (this.editingMessageId != null && this.editingMessageId === this.message.clientId) {
        this.edit();
      }
    }

    // update position message
    if (changes['previousMessage']) {
      if (
        this.message &&
        this.previousMessage &&
        !this.message?.messageReply && // no reply
        this.message.ut !== UserType.TeamBot &&
        this.message.ct !== ConvoType.personal &&
        this.message.user === this.previousMessage.user &&
        ![MsgType.system, MsgType.summary].includes(this.message.mt) &&
        this.previousMessage.mt !== MsgType.system &&
        differenceInMinutes(this.message.ts, this.previousMessage.ts) < 30
      ) {
        this.position = MessagePosition.middle;
      } else {
        this.position = MessagePosition.first;
      }

      if (this.position === MessagePosition.first && this.message.mt !== MsgType.system) {
        this.positionAction = this.message?.indexMessageReply > -1 ? '-71px' : '-43px';
      } else {
        this.positionAction = '-19px';
      }

      if (this.position === MessagePosition.first && this.message.mt !== MsgType.system) {
        this.selectUser();
      }
    }
  }

  onRightClick(event: MouseEvent) {
    event.preventDefault();

    // follow condition on HTML
    if (
      !this.isEditing &&
      (this.message.ct === ConvoType.personal ||
        this.isAllowUseBookmark ||
        this.allowUseReplyAction ||
        (this.allowUseAction && this.withinLimit))
    ) {
      const data = <RightCLickMessage>{
        xPosition: event.clientX,
        yPosition: event.clientY,
        message: this.message,
        elr: this.elr,
        menus: []
      };
      if (this.allowUseReplyAction) {
        const text =
          this.message?.mt === MsgType.attachment
            ? this.message?.body.text
            : this.elr.nativeElement.querySelector(`.content_body csh-normal-message .main-text`)?.innerText;
        data.menus.push(<MenuMessageInfo>{
          key: MenuMsg.reply,
          value: 'Reply',
          icon: 'reply',
          dataReply: <ReplyMessage>{
            user: this.user?.displayName,
            text: this.getTextInline(text),
            message: new ChatMessage(this.message)
          }
        });
      }
      if (this.configMessageOption.isBookmarkChannel && this.canJumpChannel) {
        data.menus.push(<MenuMessageInfo>{ key: MenuMsg.jumpFromBookmark, value: 'Jump to channel', icon: 'move_up' });
      }
      if (this.msgReply) {
        data.menus.push(<MenuMessageInfo>{ key: MenuMsg.jumpReply, value: 'Jump to message', icon: 'move_up' });
      }
      if (this.message.ct === ConvoType.personal) {
        data.menus.push(<MenuMessageInfo>{
          key: MenuMsg.removeBookmark,
          value: 'Remove bookmark',
          icon: 'bookmark_remove'
        });
      } else {
        data.menus.push(<MenuMessageInfo>{ key: MenuMsg.addBookmark, value: 'Add to bookmark', icon: 'bookmark_add' });
      }

      if (!this.configMessageOption.isBookmarkChannel && this.message.ct === ConvoType.groupchat && this.message.id) {
        data.menus.push(<MenuMessageInfo>{ key: MenuMsg.copyLink, value: 'Copy link to message', icon: 'link' });
      }

      if (this.allowUseAction && this.withinLimit) {
        if (this.message.mt === MsgType.message) {
          data.menus.push(<MenuMessageInfo>{ key: MenuMsg.editMessage, value: 'Edit message', icon: 'edit' });
        }
        data.menus.push(<MenuMessageInfo>{ key: MenuMsg.deleteMessage, value: 'Delete message', icon: 'delete' });
      }

      if (data.menus.length > 0) {
        this.rightClickMessage.emit(data);
      }
    }
  }

  onMentionsChanged($event) {
    this.mentionsChanged.emit($event);
  }

  onEditedMessage(event) {
    this.isEditing = false;
    this.edited.emit(true);
  }

  jumpChannel() {
    const msg = this.message?.messageBookmark;
    if (msg) {
      this.router.navigate(['conversations', msg.convo, 'messages', msg.id]);
    }
  }

  copyLinkMessage() {
    try {
      const origin = !isLocalhost()
        ? window.parent.location.origin + `/#/${X.orgUuid}/home`
        : window.location.origin + '/#';
      this.clipboardService.copyFromContent(
        `${origin}/conversations/${this.message.convo}/messages/${this.message.id}`
      );
      this.toastService.success('Copy link successfully!');
    } catch (error) {
      console.log('🚀 ~ error', error);
    }
  }

  addBookmark() {
    this.addBookmarkMessage.emit(this.message);
  }

  deleteBookmark() {
    this.removeBookmarkMessage.emit(this.message);
  }

  edit() {
    this.isEditing = true;
  }

  delete() {
    if (this.message.metadata?.deletedAt > 0 || this.message.user !== this.meQuery.getMe().userUuid) {
      return;
    }

    this.dialog
      .open(DeleteMessageComponent, {
        width: '600px',
        data: this.message
      })
      .afterClosed()
      .subscribe(res => {
        if (res && res.isConfirm) {
          const message = ChatMessage.createDeleteMessage(this.message);
          this.chatService.send(message);

          if (this.message?.mt == MsgType.attachment) {
            const data: AttachmentMessageData = this.message.body.data?.attachment || this.message.body.data;
            if (data && data.mediaId) {
              this.mediaService.deleteMediaFromStorage(data.mediaId, this.message.convo).subscribe();
            }
          }
        }
      });
  }

  replyMessage() {
    const text =
      this.message?.mt === MsgType.attachment
        ? this.message?.body.text
        : this.elr.nativeElement.querySelector('.content_body csh-normal-message .main-text')?.innerText;
    const data = <ReplyMessage>{
      user: this.user?.displayName,
      text: this.getTextInline(text),
      message: new ChatMessage(this.message)
    };
    this.replyingMessage.emit(data);
  }

  onShowProfile($event, user: User | Integration) {
    $event.stopPropagation();
    this.showProfile.emit(<InfoShowMention>{
      xPosition: $event.x,
      yPosition: $event.y,
      member: user
    });
  }

  async onExpandMsg(isExpand: boolean) {
    if (this._isShowmore) {
      return;
    }
    this._isShowmore = true;
    if (!isExpand) {
      this.message = new ChatMessage(this._backupMessage);
    } else {
      const cloneChild: ChatMessage =
        this.configMessageOption.isBookmarkChannel && !!this.message.messageBookmark
          ? this.message.messageBookmark
          : this.message;

      let msg: ChatMessage;
      const bookmarkExpandMap = this.historyMessageQuery.getValue().bookmarkExpandMap;
      if (bookmarkExpandMap?.[cloneChild.id]) {
        msg = bookmarkExpandMap[cloneChild.id];
      } else {
        const history = await firstValueFrom(
          this.historyMessageService
            .getChannelRangeHistory(
              <FilterConvoMessageRangeRequest>{
                convoId: cloneChild.convo,
                limit: 1,
                fromInclusive: true,
                toInclusive: true,
                from: cloneChild.id,
                to: cloneChild.id
              },
              <ConfigStore>{
                isNoStore: true,
                noLoading: true
              }
            )
            .pipe(
              catchError(err => {
                this.toastService.error(err.error);
                return of(null);
              })
            )
        );
        if (!history) {
          this._isShowmore = false;
          return;
        }
        msg = history.messages?.[0];
        this.historyMessageService.updateBookmarkExpandMap({
          [msg.id]: msg
        });
      }

      const messageChild = new ChatMessage({ ...msg });
      delete messageChild.pf;
      const indexMessageBookmark = this.message?.indexMessageBookmark;
      const data = JSON.parse(JSON.stringify(this.message)) as ChatMessage;
      data.extraData.linkedMessages.snapshots[indexMessageBookmark] = messageChild;

      this._backupMessage = new ChatMessage(this.message);
      this.message = new ChatMessage(data);
    }
    this.initMessage();
    this.isExpand = isExpand;
    this._isShowmore = false;
  }

  private initMessage() {
    this._destroyTimer$.next(true);
    this.messageRender =
      this.configMessageOption.isBookmarkChannel && !this.message.messageBookmark?.isSubstring
        ? this.message.messageBookmark
        : this.message;

    this.isInteractiveV2 =
      this.messageRender.mt === MsgType.imess && !!(this.messageRender.body?.data as IMessBodyData).components;
    this.isDeletedMessage = !!this.messageRender?.metadata?.deletedAt || this.messageRender?.st === SystemType.DELETE;
    if (this.isDeletedMessage) {
      this.messageRender = Object.assign(new ChatMessage(), this.messageRender);
      this.messageRender.body = new MessageBody({
        text: 'Deleted message'
      });
    }

    if (this.configMessageOption.isBookmarkChannel) {
      this.selectConvo();
    }

    if (!this.configMessageOption.isBookmarkChannel) {
      this.timeService.done$
        .pipe(
          filter(isDone => isDone),
          take(1),
          takeUntil(this._destroyTimer$)
        )
        .subscribe(() => {
          this.intervalCheckAllowAction();
        });
    }

    this.isAllowUseBookmark =
      this.configMessageOption.useBookmark &&
      !this.isDeletedMessage &&
      [MsgType.attachment, MsgType.message].includes(this.messageRender.mt);

    this.allowUseReplyAction =
      this.message.id &&
      this.message.ct !== ConvoType.personal &&
      this.message.mt !== MsgType.system &&
      [ConvoType.whatsapp, ConvoType.sms, ConvoType.customer].indexOf(this.message.ct) === -1 &&
      !this.configMessageOption.isHideAction;

    this.allowUseAction =
      (this.message.ct === ConvoType.personal ||
        (this.message.user === this.meQuery.getMe().userUuid &&
          this.message.mt !== MsgType.system &&
          [ConvoType.whatsapp, ConvoType.sms, ConvoType.customer].indexOf(this.message.ct) === -1)) &&
      !this.configMessageOption.isHideAction;
  }

  private selectUser() {
    const msg = this.configMessageOption.isBookmarkChannel ? this.message.messageBookmark : this.message;
    if (msg.user === this._preUser) {
      return;
    }
    this._preUser = msg.user;

    if (msg.ut === UserType.Customer) {
      const conversion = this.convoGroupQuery.getConvo(msg.convo);
      this.user = conversion?.customerInfo?.name ? new User({ displayName: conversion.customerInfo.name }) : null;
      if (!this.user) {
        this.user$ = this.convoGroupQuery.selectConvo(msg.convo).pipe(
          map(convo => new User({ displayName: convo?.customerInfo?.name || UNKNOWN_USER })),
          tap(user => (this.user = user))
        );
      }
    } else if (msg.ut === UserType.Webhook || msg.ut === UserType.TeamBot) {
      this.user = this.integrationQuery.getBotByChatUuid(msg.user);
      if (!this.user) {
        this.user$ = this.integrationQuery.selectAllByChatUuid(msg.user).pipe(
          map(
            user =>
              user ||
              new Integration({
                name: 'Unknown Bot'
              })
          ),
          tap(user => (this.user = user))
        );
      }
    } else {
      if (msg.hs) {
        const hs = this.hyperspaceQuery.getHyperByHyperspaceId(msg.hs);
        this.user = hs?.allMembers?.find(x => x.userUuid === msg.user);
        if (!this.user) {
          this.user$ = this.hyperspaceQuery.selectHyperByHyperspaceId(msg.hs).pipe(
            map(
              hyper =>
                hyper?.allMembers?.find(x => x.userUuid === msg.user) || new User({ displayName: 'Disabled User' })
            ),
            tap(user => (this.user = user))
          );
        }
      } else {
        this.user = this.userQuery.getUserByChatUuid(msg.user);
        if (!this.user) {
          this.user$ = this.userQuery.selectUserByChatUuid(msg.user).pipe(
            map(x => x || new User({ displayName: 'Unknown User' })),
            tap(user => (this.user = user))
          );
        }
      }
    }
  }

  private selectConvo() {
    const msg = this.message?.messageBookmark;
    if (msg?.ct === ConvoType.groupchat) {
      this.nameConvo = this.channelQuery.getEntity(msg.convo)?.displayName;
      this.canJumpChannel = !!this.nameConvo;
      if (!this.nameConvo) {
        this.nameConvo$ = this.channelQuery.selectEntity(msg.convo, 'displayName').pipe(
          map(x => {
            this.canJumpChannel = !!x;
            return x || 'Unknown Channel';
          })
        );
      }
    } else if (msg?.ct === ConvoType.direct) {
      this.canJumpChannel = true;
    }
  }

  private intervalCheckAllowAction() {
    const deta = this.timeService.nowInMillis() - this.message.ts;
    const remain = MessageConstants.TIMEOUT - deta;
    this.withinLimit = deta < MessageConstants.TIMEOUT;
    if (this.withinLimit && remain > 0) {
      setTimeout(() => {
        this.intervalCheckAllowAction();
      }, remain + 1000);
    }
  }

  private getTextInline(text: string) {
    text = text.split('<br>').join(' ');
    text = text.split('\n').join(' ');
    return text;
  }
}

export interface InfoFileMarkdown {
  fileKey: string;
  fileName: string;
}
