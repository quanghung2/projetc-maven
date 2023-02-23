import { DatePipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Profile, ProfileQuery } from '@b3networks/api/auth';
import { CustomersQuery } from '@b3networks/api/callcenter';
import { ChatMessage, ConversationGroup, MsgType, Status, SystemMessageData } from '@b3networks/api/workspace';
import {
  LinkMarkdownCompiler,
  MatchType,
  NewLineMarkdownCompiler,
  OutputProcessMessage,
  RegExpPattern,
  WidgetCompile
} from '@b3networks/chat/shared/core';
import { differenceInMinutes, format } from 'date-fns';
import { escape } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export enum PositionMessage {
  first = 'first',
  middle = 'middle',
  last = 'last',
  none = 'none'
}

@Component({
  selector: 'b3n-profile-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit, OnChanges {
  @Input() convo: ConversationGroup;
  @Input() parentElr?: HTMLElement; // use intersection to lazy loading image;
  @Input() hasChatBox: boolean;
  @Input() index: number;
  @Input() msg: ChatMessage;
  @Input() msgPre: ChatMessage;
  @Input() waitingChatbot: boolean;

  readonly MsgType = MsgType;
  readonly PositionMessage = PositionMessage;
  readonly Status = Status;
  readonly datePipeEn: DatePipe = new DatePipe('en-SG');

  position: PositionMessage;
  isMe: boolean;
  builtTextMessage: OutputProcessMessage;
  profile$: Observable<Profile>;

  constructor(private customersQuery: CustomersQuery, private profileQuery: ProfileQuery) {}
  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['msg']) {
      this.isMe = this.msg.user === this.customersQuery.getValue()?.chatCustomerId;
      this.builtTextMessage = this.renderMessage(this.msg);
      this.profile$ = this.profileQuery.profile$.pipe(map(x => x || <Profile>{ name: 'Agent' }));
    }

    if (changes['msgPre']) {
      this.position = this.getPosition();
    }
  }

  private renderMessage(chatMessage: ChatMessage): OutputProcessMessage {
    let textMessage = chatMessage.body.text;

    if (chatMessage.mt === MsgType.system) {
      const data: SystemMessageData = chatMessage.body.data as SystemMessageData;
      textMessage = data && !!data.text ? data.text : textMessage;
    }
    // const transferHTML = this.markdownService.compile(textMessage);
    const transferHTML = this.compileMarkdown(textMessage);

    // has edited
    if (chatMessage.metadata && chatMessage.metadata.editedAt > 0 && !this.isUrl(chatMessage?.body?.text)) {
      const date = this.datePipeEn.transform(chatMessage.metadata.editedAt, "MMM d 'at' HH:mm:ss");
      transferHTML.text += `<small class="tooltip tooltip-edited" style='line-height: initial'> (edited)<span class="tooltiptext"> ${date} </span></small>`;
    }
    return transferHTML;
  }

  private compileMarkdown(textMessage: string): OutputProcessMessage {
    const output: OutputProcessMessage = {
      text: textMessage,
      isTriggerDirective: false
    };

    if (!textMessage) {
      return output;
    }

    // link href
    const linkMatches = this.getCompiler(MatchType.LINK).preCompile(output);
    // The magic here
    // https://stackoverflow.com/questions/34040338/replace-string-containing-in-javascript-regex
    output.text = escape(output.text);
    // \n => br tag
    this.getCompiler(MatchType.NEW_LINE).compile(null, output, []);
    this.getCompiler(MatchType.LINK).compile(linkMatches, output);
    return output;
  }

  private getCompiler(type: MatchType) {
    let tranformer: WidgetCompile;
    switch (type) {
      case MatchType.LINK:
        tranformer = new LinkMarkdownCompiler();
        break;
      case MatchType.NEW_LINE:
        tranformer = new NewLineMarkdownCompiler();
        break;
    }
    return tranformer;
  }

  private getPosition() {
    if (this.index < 0) {
      return PositionMessage.none;
    } else if (this.index === 0) {
      return PositionMessage.first;
    } else {
      if (this.msgPre.mt !== this.msg.mt) {
        return PositionMessage.first;
      }

      if (
        this.msg.user !== this.msgPre.user ||
        format(new Date(this.msg.ts), 'yyyy-MM-dd') !== format(new Date(this.msgPre.ts), 'yyyy-MM-dd') || // diff day
        differenceInMinutes(new Date(this.msg.ts), new Date(this.msgPre.ts)) >= 30 // outside 30 min
      ) {
        return PositionMessage.first;
      }

      return PositionMessage.middle;
    }
  }

  private isUrl(message: string) {
    return message && message.match(RegExpPattern.URL);
  }
}
