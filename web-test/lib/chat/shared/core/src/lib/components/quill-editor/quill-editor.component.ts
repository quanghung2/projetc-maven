import { ENTER, PAGE_DOWN, PAGE_UP, UP_ARROW } from '@angular/cdk/keycodes';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RequestDetailLeaves, RequestLeaveQuery } from '@b3networks/api/leave';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelQuery,
  ChatService,
  Hyperspace,
  HyperspaceQuery,
  SocketStatus,
  User,
  UserHyperspace,
  UserQuery,
  UserStatus
} from '@b3networks/api/workspace';
import { deltaHasContent, DestroySubscriberComponent, randomGuid } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import Fuse from 'fuse.js';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import * as QuillNamespace from 'quill';
import { Delta, DeltaStatic, Quill } from 'quill';
import 'quill-emoji/dist/quill-emoji.js';
import 'quill-mention';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ConvoHelperService } from '../../core/adapter/convo-helper.service';
import { MessageConstants } from '../../core/constant/message.const';
import { MatchType } from '../../core/model/match.model';
import { OutputContentQuill } from '../../core/model/output-message.model';
import { MarkdownService } from '../../core/service/markdown.service';
import { RegExpPattern } from './../../core/constant/patterns.const';
import { ConfirmDisableNotifyComponent } from './confirm-disable-notify/confirm-disable-notify.component';
import { EmojiList } from './emoji/emoji-list';
import { QuillEmoji } from './emoji/quill-emoji';

const Quill_lib: any = QuillNamespace;
// Quill_lib.debug('info');
const EVERYONE = 'everyone';
const TEXT_CHANGE_DEBOUNCE_TIME = 3 * 100;

Quill_lib.register('modules/emoji', QuillEmoji);

// custom mention
const Embed = Quill_lib.import('blots/embed');
class QuillMentionCustom extends Embed {
  static create(value: MentionData) {
    const node = super.create(value);
    node.setAttribute('contenteditable', false);
    node.setAttribute('data-index', value?.index);
    node.setAttribute('data-denotation-char', value?.denotationChar);
    node.setAttribute('data-id', value?.id);
    node.setAttribute('data-value', value?.value);
    node.innerHTML = `<span class="ql-mention-denotation-char">${value?.denotationChar}</span>${value?.value}`;
    return node;
  }

  value() {
    const className = this['domNode']?.className;
    const value = {};
    value[className] = <MentionData>{
      denotationChar: this['domNode'].getAttribute('data-denotation-char'),
      id: this['domNode'].getAttribute('data-id'),
      index: this['domNode'].getAttribute('data-index'),
      value: this['domNode'].getAttribute('data-value')
    };

    return value;
  }
}

QuillMentionCustom['blotName'] = 'mention';
QuillMentionCustom['className'] = 'mention';
QuillMentionCustom['tagName'] = 'span';

Quill_lib.register({
  'formats/mentionCustom': QuillMentionCustom
});

export interface MentionData {
  denotationChar: string;
  id: string;
  index: string;
  value: string;
}

export interface QuillEditorInput {
  context: DeltaStatic | string;
  placeholder: string;
  enableEmoji: boolean;
  enableMention: boolean;
  enableUpload: boolean;
  showSendButton: boolean;
}

class QuillItem {
  public constructor(public type: MatchType, public key: string, public text: string, public index: number) {}
}

@Component({
  selector: 'csh-quill-editor',
  templateUrl: './quill-editor.component.html',
  styleUrls: ['./quill-editor.component.scss'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: { class: 'csh-quill-editor' }
})
export class CshQuillEditorComponent extends DestroySubscriberComponent implements OnInit, OnChanges, AfterViewInit {
  readonly MessageConstants = MessageConstants;
  readonly SocketStatus = SocketStatus;

  private _textChanedDebouncer: Subject<boolean> = new Subject<boolean>();
  private everyoneMention: InfoMention = new InfoMention({
    id: EVERYONE,
    value: EVERYONE,
    identityUuid: EVERYONE,
    photoUrl: '',
    status: '',
    mentionChar: MentionType.USER
  });

  formats = ['emoji', 'mention'];
  modules: QuillModules = {};
  emojiModuleId: string = randomGuid();
  websocketStatus: SocketStatus = SocketStatus.opened;
  file: any;

  @Input() data: QuillEditorInput;
  @Input() hyper: Hyperspace;

  @Output() messaged = new EventEmitter<OutputContentQuill>();
  @Output() uploadedFiles = new EventEmitter<File[]>();
  @Output() textChanged = new EventEmitter<DeltaStatic>();
  @Output() enterEditLastMessage = new EventEmitter<boolean>();

  @ViewChild(QuillEditorComponent) editor: QuillEditorComponent;

  get emptyEditor() {
    const deltas = this.editor?.quillEditor?.getContents();
    return !deltaHasContent(deltas);
  }

  constructor(
    private userQuery: UserQuery,
    private elRef: ElementRef,
    private markdownService: MarkdownService,
    private chatService: ChatService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private convoHelperService: ConvoHelperService,
    private channelQuery: ChannelQuery,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private requestLeaveQuery: RequestLeaveQuery,
    private hyperspaceQuery: HyperspaceQuery,
    private dialog: MatDialog
  ) {
    super();

    const Block = Quill_lib.import('blots/block');
    Block.tagName = 'DIV';
    Quill_lib.register(Block, true);
  }

  ngOnInit(): void {
    this.modules = {
      toolbar: '.toolbar',
      'emoji-toolbar': false,
      'emoji-textarea': true, // hide dom has textarea-emoji-control class with css
      'emoji-shortname': false,
      clipboard: {
        matchVisual: false
      }
    };

    if (this.data.enableMention) {
      this.registerMention();
    }

    if (this.data.enableEmoji) {
      this.registerEmoji();
    }

    this._textChanedDebouncer
      .pipe(debounceTime(TEXT_CHANGE_DEBOUNCE_TIME), takeUntil(this.destroySubscriber$))
      .subscribe(() => {
        this.textChanged.next(this.editor.quillEditor.getContents());
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      if (this.elRef) {
        // close all box when switch convo if showing
        const emojiBox = document.querySelector('.ql-list-container.emoji-container') as any;
        if (emojiBox) {
          emojiBox.style.display = 'none';
        }
        this.elRef?.nativeElement.querySelector('#textarea-emoji')?.remove();
      } else {
        setTimeout(() => {
          this.elRef?.nativeElement.querySelector('#textarea-emoji')?.remove();
        }, 0);
      }

      setTimeout(() => {
        this.editor.quillEditor.setText('');
        this.handleFocusInput();
        if (typeof this.data.context === 'string') {
          this.setContentsByText(this.data.context as string);
        } else {
          this.setContentsByDelta(this.data.context);
        }
      }, 300);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.editor && this.editor.quillEditor) {
        this.editor.quillEditor.on('text-change', () => {
          this._textChanedDebouncer.next(true);
        });
      }
    }, 300);

    this.chatService.socketStatus$.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      this.websocketStatus = status;
      this.cdr.detectChanges();
    });
  }

  handleFocusInput() {
    if (this.editor?.quillEditor) {
      this.editor.quillEditor.focus();
    }
  }

  handleEnterMessage() {
    // prevent enter manual
    if (this.emptyEditor) {
      return;
    }

    if (this.websocketStatus === SocketStatus.opened) {
      this.messaged.emit(this.getContents());
      this.editor.quillEditor.setText('');
    } else {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
    }
  }

  triggerShowEmojiBox() {
    this.elRef.nativeElement.querySelector('.textarea-emoji-control').click();
  }

  onCreatedQuill(quill: Quill) {
    quill.focus();
    quill.keyboard.addBinding(
      {
        key: ENTER
      } as any,
      () => {
        const emojiModule: QuillEmoji = this.editor.quillEditor.getModule('emoji');
        if (!emojiModule?.isOpen) {
          // return true = continue because alots another Enter - key cases
          // return false = completed & stop
          let isContinue = true;
          if (!this.emptyEditor) {
            this.handleEnterMessage();
            isContinue = false;
          }
          return isContinue;
        } else {
          emojiModule.selectItem();
          this._textChanedDebouncer.next(false);
          return false;
        }
      }
    );
    quill.keyboard.addBinding(
      {
        key: UP_ARROW
      } as any,
      () => {
        if (this.emptyEditor) {
          this.enterEditLastMessage.next(true);
        }
        return true;
      }
    );

    quill.keyboard.addBinding(
      {
        key: PAGE_UP
      } as any,
      () => {
        quill.setSelection(
          {
            index: 0,
            length: 0
          },
          'user'
        );
        return true;
      }
    );

    quill.keyboard.addBinding(
      {
        key: PAGE_DOWN
      } as any,
      () => {
        quill.setSelection(
          {
            index: quill.getLength() - 1,
            length: 0
          },
          'user'
        );
        return true;
      }
    );

    const keys = (quill.keyboard as any).bindings;
    // replace index of Enter key to avoid conflict : lastest -> 2
    keys[ENTER].splice(1, 0, keys[ENTER].pop());

    // add marker
    this.configClipboardQuill(quill);
  }

  upload(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.uploadMultipleFiles(files);
    this.file = undefined;
  }

  private getContents(): OutputContentQuill {
    const messageData = this.editor?.quillEditor?.getContents();

    let messageBuilder = '';
    const mentionArr: MentionData[] = [];

    messageData?.ops.forEach(op => {
      const insert = op.insert as any;
      if (insert.mention) {
        if (insert.mention.denotationChar === MentionType.USER) {
          messageBuilder += `<${MentionType.USER}${insert.mention.id}>`;
        } else {
          messageBuilder += `<${MentionType.CONVO}${insert.mention.id}>`;
        }
        mentionArr.push(insert.mention);
      } else if (insert.emoji) {
        const findEmoji = EmojiList.find(x => x.name === insert.emoji);
        messageBuilder += findEmoji.shortname;
      } else {
        messageBuilder += insert.toString();
      }
    });

    messageBuilder = messageBuilder.trim();

    if (messageBuilder || mentionArr.length > 0) {
      const msg = this.markdownService.removeMentionEmojiOnMarkdown(messageBuilder, mentionArr);

      let mentions = mentionArr.filter(item => msg.indexOf(`<@${item.id}>`) > -1).map(y => y.id);
      mentions = mentions.filter((x, i, a) => a.indexOf(x) === i); // distinct
      return new OutputContentQuill(mentions, msg);
    } else {
      return null;
    }
  }

  private registerEmoji() {
    this.modules['emoji'] = {
      allowedChars: RegExpPattern.ALLOWED_CHARS,
      mentionDenotationChars: [MentionType.EMOJI],
      id: this.emojiModuleId,
      source: (searchTerm, renderList) => {
        if (searchTerm.length > 0) {
          const si = searchTerm.toLowerCase();
          const options = {
            keys: ['shortname'],
            threshold: 0.1,
            includeScore: true
          };

          const list = new Fuse(EmojiList, options)
            .search(si)
            .map(r => r.item)
            .slice(0, 7);
          renderList(list, searchTerm);
        }
      }
    };
  }

  private registerMention() {
    this.modules['mention'] = {
      allowedChars: RegExpPattern.ALLOWED_CHARS_HAS_SPACE,
      mentionDenotationChars: [MentionType.USER, MentionType.CONVO],
      fixMentionsToQuill: true,
      onSelect: (item: MentionData, insertItem) => {
        const editor = this.editor.quillEditor;
        insertItem(item);
        editor.insertText(editor.getLength() - 1, '', 'user');

        if (!this.hyper && item.denotationChar === MentionType.USER) {
          const user = this.userQuery.getUserByChatUuid(item.id);
          const requestLeaveNow = this.requestLeaveQuery.getEntity(user?.uuid)?.requestLeaveNow;
          if (requestLeaveNow) {
            this.dialog
              .open(ConfirmDisableNotifyComponent, { data: { user: user, requestLeaveNow: requestLeaveNow } })
              .afterClosed()
              .subscribe(confirm => {
                editor.focus();
                if (confirm) {
                  const textInsert = '`' + user.displayName + '` ';
                  editor.deleteText(editor.getSelection().index - 2, 2, 'user');
                  editor.insertText(editor.getSelection().index, textInsert, 'user');
                  editor.setSelection(
                    <any>{
                      index: editor.getSelection().index + textInsert.length,
                      length: 0
                    },
                    'user'
                  );
                }
              });
          }
        }
      },
      source: (searchTerm, renderList, mentionChar) => {
        if (!searchTerm) {
          return;
        }

        let data;
        if (mentionChar === '@') {
          data = this.renderMembers(searchTerm);
        } else {
          data = this.renderChannels(searchTerm);
        }
        renderList(data);
      },
      renderItem: (item: InfoMention) => {
        if (item.mentionChar && item.mentionChar === MentionType.USER) {
          if (item.id === EVERYONE) {
            return `<div class='item-container'><div class='item-inner'><span class="material-icons">volume_up</span><span class='ql-name'>${item.value}</span></div></div>`;
          } else {
            return `
              <div class='item-container'>
                <div class='item-inner'>
                  <svg style="height: 24px; width: 24px;">
                    <g>
                      <image
                        x="0"
                        y="0"
                        height="100%"
                        width="100%"
                        xlink:href="${item.photoUrlOrDefault}"
                        style="clip-path: circle(12px at center);"
                      ></image>
                      <circle cx="20" cy="20" r="4" fill="${item.isOnline ? '#5cb85c' : '#e0e0e0'}"></circle>
                    </g>
                  </svg>
                  <span class='ql-name'>${item.value}</span>
                  ${
                    item.requestLeaveNow
                      ? `<span> is on <span class='item-leave'>${item.requestLeaveNow?.displayText}</span> </span>`
                      : ''
                  }
                </div>
                ${
                  item.nameOrg
                    ? item.isCurrentOrg
                      ? `<span>-</span><span class='curent-org'>${item.nameOrg}</span>`
                      : `<span>-</span><span class='other-org'>${item.nameOrg}</span>`
                    : ''
                }
              </div>
            `;
          }
        } else {
          return `<div class='item-container'><div class='item-inner'>#${item.value}</div></div>`;
        }
      }
    };
  }

  private configClipboardQuill(quill: Quill) {
    quill.clipboard.addMatcher(`code`, (node: HTMLElement, delta: Delta) => {
      if (node.classList.contains('codespan')) {
        delta.ops.unshift({ insert: '`' });
        delta.ops.push({ insert: '`' });
      }
      return delta;
    });

    // code && user mention
    quill.clipboard.addMatcher(`pre`, (node: HTMLElement, delta: Delta) => {
      // code
      if (node.classList.contains('code')) {
        delta.ops.unshift({ insert: '```' });
        delta.ops.push({ insert: '```' });
      } else if (node.classList.contains('message_mention')) {
        // memtion user
        const uuid = node.getAttribute('data-user-uuid');
        if (uuid === EVERYONE) {
          delta.ops = [];
          delta.insert({
            mention: <MentionData>{
              denotationChar: '@',
              id: this.everyoneMention.id,
              value: this.everyoneMention.value
            }
          });
        } else {
          const user = this.userQuery.getEntity(uuid);
          if (user) {
            delta.ops = [];
            delta.insert({
              mention: <MentionData>{
                denotationChar: '@',
                id: user.userUuid,
                value: user.displayName
              }
            });
          }
        }
      }
      return delta;
    });

    // channel, highlight link
    quill.clipboard.addMatcher(`a`, (node: any, delta: Delta) => {
      if (node.classList.contains('message_mention_channel')) {
        const uuidConvo = node.getAttribute('data-channel');
        const channel = this.channelQuery.getEntity(uuidConvo);
        if (channel) {
          delta.ops = [];
          delta.insert({
            mention: <MentionData>{
              denotationChar: '#',
              id: channel.id,
              value: channel.name
            }
          });
        }
      } else if (node.classList.contains('highlight-link')) {
        delta.ops = [];
        delta.insert(`[${node?.innerText}]`);
        delta.insert(`(${node?.href})`);
      }
      return delta;
    });

    // emoji , italic
    quill.clipboard.addMatcher(`i`, (node: HTMLElement, delta: Delta) => {
      if (['ap', 'ap-emoji'].every(x => node.classList.contains(x))) {
        const find = EmojiList.find(x => x.shortname === node.innerText);
        if (find) {
          delta.ops = [];
          delta.insert({
            emoji: find
          });
        }
      } else if (node.classList.contains('italic')) {
        delta.ops.unshift({ insert: '_' });
        delta.ops.push({ insert: '_' });
      }
      return delta;
    });

    // ignore icon
    quill.clipboard.addMatcher('mat-icon', (node, delta) => {
      delta.ops = [];
      return delta;
    });

    // strike, emoji of delta
    quill.clipboard.addMatcher('span', (node: HTMLElement, delta: Delta) => {
      if (node.classList.contains('strike')) {
        delta.ops.unshift({ insert: '~' });
        delta.ops.push({ insert: '~' });
      } else if (node.classList.contains('ql-emojiblot')) {
        const find = EmojiList.find(x => x.name === node.getAttribute('data-name'));
        if (find) {
          delta.ops = [];
          delta.insert({
            emoji: find
          });
        }
      } else if (node.classList.contains('mention')) {
        // memtion user
        const denotationChar = node.getAttribute('data-denotation-char');
        const index = node.getAttribute('data-index');
        const id = node.getAttribute('data-id');
        const value = node.getAttribute('data-value');
        delta.ops = [];
        delta.insert({
          mention: <MentionData>{
            denotationChar: denotationChar,
            id: id,
            index: index,
            value: value
          }
        });
      }
      return delta;
    });

    // blob
    quill.clipboard.addMatcher('strong', (node: HTMLElement, delta: Delta) => {
      if (node.classList.contains('bold')) {
        delta.ops.unshift({ insert: '*' });
        delta.ops.push({ insert: '*' });
      }
      return delta;
    });

    // time msg
    quill.clipboard.addMatcher('small', (node: HTMLElement, delta: Delta) => {
      if (node.classList.contains('time_msg')) {
        if (node.innerText?.trim()) {
          delta.ops = [];
          delta.insert(`[${node.innerText}]`);
        }
      }
      return delta;
    });

    // avatar without image
    quill.clipboard.addMatcher('text', (node: HTMLElement, delta: Delta) => {
      delta.ops = [];
      return delta;
    });

    quill.clipboard.addMatcher('img', (node: any, delta: Delta) => {
      const img = node?.src;
      if (img) {
        this.clipboardData();
      }
      return delta;
    });
  }

  private async clipboardData() {
    try {
      const clipboardContents = (await (navigator.clipboard as any)?.read()) || [];
      for (const item of clipboardContents) {
        if (!item.types.includes('image/png')) {
          return;
        }
        const blob = await item.getType('image/png');
        const nameFile = blob.type.split('/')[1];
        const file = new File([blob], `Pasted_image_${new Date().getTime()}.${nameFile}`, { type: blob.type });
        this.uploadMultipleFiles([file]);
      }
    } catch (error) {
      console.log('🚀 ~ error', error);
    }
  }

  private renderMembers(searchTerm: string): InfoMention[] {
    const members: InfoMention[] = [];
    if (EVERYONE.indexOf(searchTerm.toLowerCase()) > -1) {
      members.push(this.everyoneMention);
    }

    const options = {
      keys: ['displayName'],
      threshold: 0.1,
      includeScore: true
    };

    if (this.hyper) {
      const list = this.hyperspaceQuery.getAllUsersContains(this.hyper.id, searchTerm, -1, options).map(
        (item: UserHyperspace) =>
          new InfoMention({
            id: item.userUuid, // using chat user uuid
            value: item.displayName,
            identityUuid: item.uuid,
            photoUrl: item.photoUrl,
            status: item.status,
            mentionChar: MentionType.USER,
            requestLeaveNow: null,
            nameOrg: item.shortName,
            isCurrentOrg: item.isCurrentOrg
          })
      );
      return members.concat(list);
    } else {
      const list = this.userQuery.getAllUsersContains(searchTerm, -1, options).map(
        item =>
          new InfoMention({
            id: item.userUuid, // using chat user uuid
            value: item.displayName,
            identityUuid: item.uuid,
            photoUrl: item.photoUrl,
            status: item.status,
            mentionChar: MentionType.USER,
            requestLeaveNow: this.requestLeaveQuery.getEntity(item.uuid)?.requestLeaveNow
          })
      );
      return members.concat(list);
    }
  }

  private renderChannels(searchTerm: string): InfoMention[] {
    const option = {
      keys: ['name'],
      threshold: 0.1,
      includeScore: true
    };
    let list: InfoMention[] = [];
    if (this.hyper) {
      list = this.convoHelperService
        .getSearchablePrivateChannelsHyperspaceContains(this.hyper.hyperspaceId, searchTerm, -1, option)
        ?.result.map(
          data =>
            new InfoMention({
              id: data?.item.id,
              value: data?.item.name,
              mentionChar: MentionType.CONVO
            })
        );
    } else {
      list = this.convoHelperService.getSearchablePrivateChannelsContains(searchTerm, -1, option)?.result.map(
        data =>
          new InfoMention({
            id: data?.item.id,
            value: data?.item.name,
            mentionChar: MentionType.CONVO
          })
      );
    }
    return list;
  }

  private uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadedFiles.emit(files);
    }
  }

  // ======================== transform text info quill ==============================

  private setContentsByDelta(context: DeltaStatic) {
    if (!context) {
      return;
    }

    // transfer object by emoji format
    context.ops.forEach(op => {
      if (typeof op.insert === 'object' && op?.insert?.emoji) {
        const find = EmojiList.find(x => x.name === op.insert.emoji);
        if (find) {
          op.insert.emoji = find;
        }
      }
    });
    this.editor.quillEditor.setContents(context, Quill_lib.sources.API);
    this.editor.quillEditor.setSelection(this.editor.quillEditor.getLength() - 1, Quill_lib.sources.API);
  }

  private setContentsByText(txt: string) {
    if (!txt) {
      return;
    }

    let matches = [];
    let em = [];
    let text = txt;

    const findPattern = (char: string, type: MatchType, pattern: RegExp, mm: any[]): string => {
      char = char.replace(pattern, (...m) => {
        const item = new QuillItem(type, randomGuid(), m[0], m[m.length - 2]);
        mm.push(item);

        return item.text;
      });

      return char;
    };

    text = findPattern(text, MatchType.BLOCKQUOTE, RegExpPattern.CODE, matches);
    text = findPattern(text, MatchType.CODE, RegExpPattern.MARK_SINGLE_QUOTE, matches);
    text = findPattern(text, MatchType.MENTION, RegExpPattern.MENTION, em);
    text = findPattern(text, MatchType.CHANNEL, RegExpPattern.CHANNEL, em);
    text = findPattern(text, MatchType.EMOJI, RegExpPattern.EMOJI, em);

    em = em.sort((x, y) => (x.index > y.index ? -1 : 1));
    matches = matches.sort((x, y) => (x.index > y.index ? -1 : 1));
    let eem = [];
    // Remove emoji or mention in the blockcode
    em.forEach(e => {
      if (!matches.some(m => m.index < e.index && m.index + m.length > e.index + e.length)) {
        eem.push(e);
      }
    });

    const startPosition = 0;
    this.editor.quillEditor.insertText(startPosition, text);
    // Replace from end to start of string to ensure that index is not change
    eem = eem.sort((x, y) => (x.index > y.index ? -1 : 1));

    eem.forEach(e => {
      switch (e.type) {
        case MatchType.EMOJI:
          this.onConvertEmoji(e.text.trim(':'), e.index + startPosition);
          break;

        case MatchType.MENTION:
        case MatchType.CHANNEL:
          this.insertMentionOrChannel(e.text, e.index + startPosition, e.type);
          break;
      }
    });

    const delta = this.editor.quillEditor.getContents();
    this.editor.quillEditor.setText(''); // reset quill
    this.setContentsByDelta(delta);
  }

  private onConvertEmoji(name: string, cursorPosition: number) {
    const find = EmojiList.find(x => x.shortname.toLowerCase() === name.toLowerCase());
    if (find) {
      if (cursorPosition === 0) {
        this.editor.quillEditor.insertText(0, ' ', Quill_lib.sources.API);
        cursorPosition = 1;
      }

      this.editor.quillEditor.deleteText(cursorPosition, name.length);
      this.editor.quillEditor.insertEmbed(cursorPosition, 'emoji', find, Quill_lib.sources.API);
    }
  }

  private insertMentionOrChannel(chatUuid: string, index: number, type: MatchType) {
    if (type === MatchType.MENTION) {
      chatUuid = chatUuid.replace('<@', '').replace('>', '');
      let member: InfoMention | User;
      if (chatUuid === EVERYONE) {
        member = this.everyoneMention;
      } else if (this.hyper) {
        member = this.hyper.allMembers.find(x => x.userUuid === chatUuid);
      } else {
        member = this.userQuery.getUserByChatUuid(chatUuid);
      }

      if (!member) {
        return;
      }

      this.editor.quillEditor.deleteText(index, chatUuid.length + 3);
      this.editor.quillEditor.insertEmbed(index, 'mention', <MentionData>{
        id: member instanceof InfoMention ? member.id : member.userUuid,
        value: member instanceof InfoMention ? member.value : member.displayName,
        denotationChar: '@'
      });
    }

    if (type === MatchType.CHANNEL) {
      chatUuid = chatUuid.replace('<#', '').replace('>', '');
      let channel: Channel | ChannelHyperspace;
      if (this.hyper) {
        channel = this.channelHyperspaceQuery.getEntity(chatUuid);
      } else {
        channel = this.channelQuery.getEntity(chatUuid);
      }

      if (!channel) {
        return;
      }

      this.editor.quillEditor.deleteText(index, chatUuid.length + 3);
      this.editor.quillEditor.insertEmbed(
        index,
        'mention',
        <MentionData>{
          id: channel.id,
          value: channel.name,
          denotationChar: '#'
        },
        Quill_lib.sources.API
      );
    }
  }
}

class InfoMention {
  id: string;
  value: string;
  identityUuid: string;
  photoUrl: string;
  status: string;
  mentionChar: MentionType;
  requestLeaveNow: RequestDetailLeaves;
  nameOrg: string;
  isCurrentOrg: boolean;

  constructor(obj?: Partial<InfoMention>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get hasPhoto() {
    return !!this.photoUrl && this.photoUrl.indexOf('http') > -1;
  }

  get photoUrlOrDefault() {
    return this.hasPhoto ? this.photoUrl : 'https://ui.b3networks.com/external/logo/default_org_icon.png';
  }

  get isOnline() {
    return this.status === UserStatus.online;
  }
}

enum MentionType {
  USER = '@',
  CONVO = '#',
  EMOJI = ':'
}
