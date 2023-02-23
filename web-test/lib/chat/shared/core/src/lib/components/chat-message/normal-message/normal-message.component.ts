import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  ChannelHyperspaceService,
  ChannelHyperspaceUI,
  ChannelService,
  ChannelUI,
  ChatMessage,
  ChatService,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  ConvoType,
  HistoryMessageService,
  MessageBody,
  MsgType,
  NetworkService,
  PreviewMessageData,
  StatusMessage,
  SystemMessageData,
  SystemType,
  TimeService,
  UserQuery
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, FirstWordPipe } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, take, takeUntil } from 'rxjs/operators';
import { MessageConstants } from '../../../core/constant/message.const';
import { RegExpPattern } from '../../../core/constant/patterns.const';
import { OutputContentQuill, OutputProcessMessage } from '../../../core/model/output-message.model';
import { InfoMarkdown, MarkdownService } from '../../../core/service/markdown.service';
import { MessageReceiveProcessor } from '../../../core/service/message-receive.processor';
import { InfoShowMention } from '../../../core/state/app-state.model';
import { CshQuillEditorComponent, QuillEditorInput } from '../../quill-editor/quill-editor.component';
import { ConfigMessageOption } from '../chat-message.component';

@Component({
  selector: 'csh-normal-message',
  templateUrl: './normal-message.component.html',
  styleUrls: ['./normal-message.component.scss']
})
export class NormalMessageComponent extends DestroySubscriberComponent implements OnChanges {
  @ViewChild('quill') quill: CshQuillEditorComponent;

  @Input() message: ChatMessage;
  @Input() isEditing: boolean;
  @Input() configMessageOption: ConfigMessageOption;
  @Input() isExpand: boolean;

  @Output() edited = new EventEmitter<boolean>();
  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();
  @Output() mentionsChanged = new EventEmitter<string[]>();
  @Output() expandMsg = new EventEmitter<boolean>();

  readonly datePipeEn: DatePipe = new DatePipe('en-SG');
  readonly MessageType = MsgType;
  readonly MessageConstants = MessageConstants;
  readonly ConvoType = ConvoType;

  builtTextMessage: OutputProcessMessage;
  quillInput: QuillEditorInput = <QuillEditorInput>{
    enableMention: true,
    enableEmoji: true
  };

  isTimeoutResponse: boolean;
  isFailed: boolean;
  isErrorFormat: boolean;

  // for PersistentFlag.IsSubstring
  isSubstring: boolean;

  // preview
  previewData: PreviewMessageData;
  backgroundImage: string;
  isYoutube: boolean;
  htmlDecode: string;
  extractUrl: string;
  embededUrlYoutube: string;
  srcDocYoutube: string;

  constructor(
    private toastService: ToastService,
    private markdownService: MarkdownService,
    private messageService: HistoryMessageService,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private channelService: ChannelService,
    private channelHyperspaceService: ChannelHyperspaceService,
    private chatService: ChatService,
    public timeService: TimeService,
    private messageReceiveProcessor: MessageReceiveProcessor,
    private networkService: NetworkService,
    private userQuery: UserQuery,
    private firstWordPipe: FirstWordPipe
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']) {
      if (this.message.ct !== ConvoType.personal) {
        if (this.message.mt === MsgType.system) {
          const system: SystemMessageData = this.message.body?.data as SystemMessageData;
          const txt =
            system && !!system.text ? system.text : system?.data?.text ? system.data.text : this.message.body?.text;
          if (!txt) {
            this.isErrorFormat = true;
            this.message = Object.assign(new ChatMessage(), this.message);
            this.message.body = new MessageBody({
              text: 'Unrenderable message!'
            });
          }
        } else if (!this.message.body?.text) {
          this.isErrorFormat = true;
          this.message = Object.assign(new ChatMessage(), this.message);
          this.message.body = new MessageBody({
            text: 'Unrenderable message!'
          });
        }
      }

      this.builtTextMessage = this.renderMessage(this.message);

      if (!this.message.id && this.message.mt === MsgType.message) {
        const deta = MessageConstants.RESEND - (this.timeService.nowInMillis() - this.message.ts);
        if (deta > 0) {
          setTimeout(() => {
            if (!this.message.id) {
              this.isTimeoutResponse = true;
            }
          }, deta);
        }
      }

      if (this.message.id) {
        this.isTimeoutResponse = false;
      }

      if (!this.isErrorFormat) {
        const data = this.message.body?.data;
        const isPreview = data?.desc || data?.icon || data?.image || data?.title;
        if (this.message.mt === MsgType.message && isPreview) {
          this.setupPreviewMsg();
        } else {
          this.previewData = null;
        }
      }
    }

    if (changes['isEditing'] && this.isEditing) {
      this.quillInput = { ...this.quillInput, context: this.message.body.text };
      fromEvent(document, 'keydown')
        .pipe(
          debounceTime(300),
          filter(e => (e as KeyboardEvent).key === 'Escape'),
          take(1),
          takeUntil(this.destroySubscriber$)
        )
        .subscribe(() => {
          this.resetEdit();
        });
    }
  }

  onShowProfile($event) {
    this.showProfile.emit($event);
  }

  resend() {
    if (!this.networkService.isOnline) {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
      return;
    }

    setTimeout(() => {
      const clone = new ChatMessage({ ...this.message });
      clone.markIsRetry();
      this.chatService.send(clone);
    });
  }

  removeUnsend(message: ChatMessage) {
    this.messageService.removeMessage(message);
    // trigger delete this msg in view
    const eventDeleteMsg = ChatMessage.createDeleteMessage(message);
    eventDeleteMsg.client_ts = message.client_ts;
    eventDeleteMsg.markIsNoStore();
    this.messageReceiveProcessor.pushEventMessage(eventDeleteMsg);
  }

  handleEnterMessage(data: OutputContentQuill) {
    const message = new ChatMessage(this.message);
    message.body = new MessageBody({ text: data?.msg });
    message.st = SystemType.EDIT;
    if (message?.messageReply) {
      if (message.messageReply?.metadata) {
        delete message?.messageReply.metadata;
      }
    }
    this.chatService.send(message);
    this.resetEdit();

    if (data?.mentions?.length > 0 && this.message.ct === ConvoType.groupchat) {
      this.mentionsChanged.emit(data.mentions);
    }
  }

  resetEdit() {
    this.edited.emit(true);
    if (this.message.isFromChannel) {
      if (this.message?.hs) {
        this.channelHyperspaceService.updateChannelViewState(this.message.convo, <ChannelHyperspaceUI>{
          editingMessageId: null
        });
      } else {
        this.channelService.updateChannelViewState(this.message.convo, <ChannelUI>{
          editingMessageId: null
        });
      }
    } else {
      if (this.message.ct === ConvoType.email) {
        const convo = this.convoGroupQuery.getConvosByChildId(this.message.convo);
        if (convo[0]) {
          this.convoGroupService.updateConvoViewState(convo[0].conversationGroupId, <ConversationGroupUI>{
            editingMessageId: null
          });
        }
      } else {
        this.convoGroupService.updateConvoViewState(this.message.convo, <ConversationGroupUI>{
          editingMessageId: null
        });
      }
    }
  }

  send() {
    this.quill.handleEnterMessage();
  }

  private isUrl(message: string) {
    return message && message.match(RegExpPattern.URL);
  }

  private renderMessage(chatMessage: ChatMessage): OutputProcessMessage {
    if (chatMessage.ct === ConvoType.email && typeof chatMessage.body.data === 'string') {
      chatMessage.body.data = JSON.parse(chatMessage.body.data);
    }

    const cloneMessage: ChatMessage =
      this.configMessageOption.isBookmarkChannel && !!chatMessage.messageBookmark
        ? chatMessage.messageBookmark
        : chatMessage;
    this.isSubstring = cloneMessage?.isSubstring;

    const transferHTML = this.getTextMsg(cloneMessage);
    // has edited
    this.isFailed = cloneMessage.body.data?.waSentStatus?.status === StatusMessage.failed;
    if (
      !this.isFailed &&
      cloneMessage?.metadata &&
      cloneMessage?.metadata?.editedAt > 0 &&
      !this.isUrl(cloneMessage?.body?.text)
    ) {
      const date = this.datePipeEn.transform(cloneMessage?.metadata?.editedAt, "MMM d 'at' HH:mm:ss");
      transferHTML.text += `<small class="tooltip tooltip-edited" style='line-height: initial'> (edited)<span class="tooltiptext"> ${date} </span></small>`;
    }

    return transferHTML;
  }

  private splitMulti(str: string, tokens: string[]) {
    const tempChar = tokens[0]; // We can use the first token as a temporary join character
    for (let i = 1; i < tokens.length; i++) {
      str = str.split(tokens[i]).join(tempChar);
    }
    return str.split(tempChar);
  }

  private getTextMsg(cloneMessage: ChatMessage) {
    let textMessage = cloneMessage.body.text;
    if (cloneMessage.mt === MsgType.system && !!(cloneMessage.body?.data as SystemMessageData)?.text) {
      textMessage = (cloneMessage.body?.data as SystemMessageData).text;
    }

    return this.markdownService.compile(textMessage, <InfoMarkdown>{
      hyperId: cloneMessage.hs
    });
  }

  private setupPreviewMsg() {
    this.previewData = this.message.body.data as PreviewMessageData;
    this.backgroundImage =
      this.previewData.image && this.previewData?.image?.indexOf('https') >= 0
        ? `url('${this.previewData.image}')`
        : null;

    const match = this.message.body.text?.match(RegExpPattern.YOUTUBE);
    this.isYoutube = !!this.message.body?.text && !!match;
    const links = this.message.body.text?.match(RegExpPattern.URL);
    this.extractUrl = links && links.length > 0 ? links[0] : '#';

    if (!this.isYoutube) {
      if (this.previewData.desc) {
        const div = document.createElement('div');
        div.innerHTML =
          this.previewData.desc?.length > 200 ? this.previewData.desc?.slice(0, 200) + '...' : this.previewData.desc;
        this.htmlDecode = div.childNodes.length === 0 ? '' : div.childNodes[0].nodeValue;
      }
    } else {
      this.embededUrlYoutube = match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1` : '';
      this.srcDocYoutube = match
        ? `<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img,span{position:absolute;width:100%;top:0;bottom:0;margin:auto}span{height:1.5em;text-align:center;font:48px/1.5 sans-serif;color:white;text-shadow:0 0 0.5em black}</style><a href=https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1><img src=https://img.youtube.com/vi/${match[1]}/mqdefault.jpg><span>▶</span></a>`
        : '';
    }
  }
}
