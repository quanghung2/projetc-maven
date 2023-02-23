import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  ChatMessage,
  ConvoType,
  MsgType,
  SystemMessageData,
  TimeService,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { RegExpPattern } from '../../../core/constant/patterns.const';
import { OutputProcessMessage } from '../../../core/model/output-message.model';
import { InfoMarkdown, MarkdownService } from '../../../core/service/markdown.service';
import { InfoShowMention } from '../../../core/state/app-state.model';

@Component({
  selector: 'csh-reply-message',
  templateUrl: './reply-message.component.html',
  styleUrls: ['./reply-message.component.scss']
})
export class ReplyMessageComponent extends DestroySubscriberComponent implements OnChanges {
  @Input() msgReply: ChatMessage;

  @Output() jumpToMessage = new EventEmitter<string>();
  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();

  builtTextMessage: OutputProcessMessage;
  user: User;
  user$: Observable<User>;

  readonly datePipeEn: DatePipe = new DatePipe('en-SG');

  constructor(private markdownService: MarkdownService, public timeService: TimeService, private userQuery: UserQuery) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['msgReply']) {
      this.user = this.userQuery.getUserByChatUuid(this.msgReply.user);
      if (!this.user) {
        this.user$ = this.userQuery.selectUserByChatUuid(this.msgReply.user);
      }

      this.builtTextMessage = this.renderMessage(this.msgReply);
    }
  }

  navigateMessage($event: MouseEvent, replyMessage: ChatMessage) {
    $event.stopPropagation();
    $event.preventDefault();
    this.jumpToMessage.emit(replyMessage.id);
  }

  private renderMessage(chatMessage: ChatMessage): OutputProcessMessage {
    if (chatMessage.ct === ConvoType.email && typeof chatMessage.body.data === 'string') {
      chatMessage.body.data = JSON.parse(chatMessage.body.data);
    }

    const cloneMessage = chatMessage;

    const transferHTML = this.getTextMsg(cloneMessage);
    if (cloneMessage?.metadata && cloneMessage?.metadata?.editedAt > 0 && !this.isUrl(cloneMessage?.body?.text)) {
      const date = this.datePipeEn.transform(cloneMessage?.metadata?.editedAt, "MMM d 'at' HH:mm:ss");
      transferHTML.text += `<small class="tooltip tooltip-edited" style='line-height: initial'> (edited)<span class="tooltiptext"> ${date} </span></small>`;
    }

    return transferHTML;
  }

  private isUrl(message: string) {
    return message && message.match(RegExpPattern.URL);
  }

  private getTextMsg(cloneMessage: ChatMessage) {
    let textMessage = cloneMessage.body.text;
    if (cloneMessage.mt === MsgType.system && !!(cloneMessage.body?.data as SystemMessageData)?.text) {
      textMessage = (cloneMessage.body?.data as SystemMessageData).text;
    }

    return this.markdownService.compile(textMessage, <InfoMarkdown>{
      hyperId: cloneMessage.hs,
      noCode: true,
      noSingleCode: true
    });
  }
}
