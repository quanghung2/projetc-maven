import { ENTER } from '@angular/cdk/keycodes';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CustomerChatBox, CustomersQuery, CustomersService, UIConfig } from '@b3networks/api/callcenter';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  ConvoType,
  FilterConvoMessageReq,
  HistoryMessageQuery,
  HistoryMessageService,
  MessageBody,
  MsgType,
  ReconnectChatStragery,
  SocketStatus,
  SystemMsgType,
  UserType
} from '@b3networks/api/workspace';
import { UploadDialogComponent } from '@b3networks/chat/shared/chat-widget';
import { EmojiList, MarkdownService, OutputContentQuill, UploadDialogInput } from '@b3networks/chat/shared/core';
import { deltaHasContent, DestroySubscriberComponent, detectMobile } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns-tz';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import * as QuillNamespace from 'quill';
import { Delta, Quill } from 'quill';
import { fromEvent, Observable, Subscription, timer } from 'rxjs';
import { debounceTime, filter, finalize, map, share, switchMap, takeUntil, tap } from 'rxjs/operators';

const Quill_lib: any = QuillNamespace;
const DEFAULT_LIMIT = 20;

@Component({
  selector: 'b3n-chatbox-content',
  templateUrl: './chatbox-content.component.html',
  styleUrls: ['./chatbox-content.component.scss']
})
export class ChatboxContentComponent extends DestroySubscriberComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild(QuillEditorComponent) editor: QuillEditorComponent;
  @ViewChild('viewport') viewport: ElementRef<HTMLElement>;

  @Input() livechat: ConversationGroup;
  @Input() hasChatBox: boolean;
  @Input() animation: boolean;
  @Output() onStartOver = new EventEmitter<boolean>();

  messages$: Observable<ChatMessage[]>;
  viewDate$: Observable<number>;
  customer$: Observable<CustomerChatBox>;
  loadingHistory$: Observable<boolean>;
  onmessage$: Observable<ChatMessage>;
  uiConfig$: Observable<UIConfig>;

  placeholder = 'Send a message';
  quillConfig: QuillModules = {
    toolbar: '.toolbar',
    clipboard: {
      matchVisual: false
    }
  };

  answers$: Observable<string[]>;
  hasAnswers: boolean;
  loadingFirst = true;

  private isScrollToLatestSeenMessage: boolean;
  private _id: string;
  private websocketStatus: SocketStatus;
  private isLoadingMoreAppend: boolean;
  private isLoadingMorePrepend: boolean;

  // handle scroll
  private recoverStragery = new ReconnectChatStragery({ reconnectTimes: 0, maxReconnect: 15 });
  private timer$: Subscription;

  readonly MsgType = MsgType;

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent | any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent | any) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files) as File[];
    this.uploadMultipleFiles(files, this.livechat);
  }

  get emptyEditor() {
    const deltas = this.editor?.quillEditor?.getContents();
    return !deltaHasContent(deltas);
  }

  constructor(
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private dialog: MatDialog,
    private customersQuery: CustomersQuery,
    private customersService: CustomersService,
    private messageQuery: HistoryMessageQuery,
    private messageService: HistoryMessageService,
    public breakpointObserver: BreakpointObserver,
    private chatService: ChatService,
    private toastService: ToastService,
    private markdownService: MarkdownService,
    public elr: ElementRef
  ) {
    super();
    this.trackingWidgetDevice();

    const Block = Quill_lib.import('blots/block');
    Block.tagName = 'DIV';
    Quill_lib.register(Block, true);
  }

  ngOnInit(): void {
    this.loadingHistory$ = this.messageQuery.selectLoading();

    this.onmessage$ = this.chatService.onmessage().pipe(
      takeUntil(this.destroySubscriber$),
      filter(msg => msg.convo === this.livechat.conversationGroupId),
      tap(message => {
        if (message.ct === ConvoType.customer) {
          if (message?.mt === MsgType.mcq) {
            this.customersService.updateUI(<UIConfig>{
              waitingChatbot: false,
              showFooter: false
            });
            this.animation = false;
            const answers = message?.body?.data;
            if (answers) {
              this.customersService.updateFlow(message?.body?.data);
            }
          } else if (message?.mt === MsgType.message && message.ut === UserType.System) {
            const customer = this.customersQuery.getValue()?.chatCustomerId;
            if (message.user !== customer) {
              this.customersService.updateUI(<UIConfig>{
                waitingChatbot: false,
                showFooter: true
              });
              this.animation = true;
              this.customersService.updateFlow([]);
            }
          } else if (message?.mt === MsgType.system) {
            if (message?.body?.data?.type === SystemMsgType.archived) {
              this.animation = false;
            }
          }
        }
      })
    );

    this.answers$ = this.customersQuery.answers$.pipe(
      tap(ans => {
        this.hasAnswers = ans?.length > 0;
        if (this.hasAnswers) {
          this.destroyTimer();
          this.scrollToBottom();
        }
      })
    );
    this.customer$ = this.customersQuery.select();
    this.chatService.socketStatus$.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      this.websocketStatus = status;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['livechat'] && this._id !== this.livechat.conversationGroupId) {
      this._id = this.livechat.conversationGroupId;
      this.animation = false;
      const isLoaded = this.convoGroupQuery.getConvoUiState(this.livechat.conversationGroupId)?.loaded;
      if (!isLoaded) {
        this.loadHistoryFirst();
      } else {
        this.loadingFirst = false;
        this.isScrollToLatestSeenMessage = true;
      }

      this.uiConfig$ = this.customersQuery.ui$;
      this.viewDate$ = this.convoGroupQuery.selectUIState(this.livechat.conversationGroupId, 'viewDate');

      this.messages$ = this.messageQuery.selectAllByConversation(this.livechat.conversationGroupId).pipe(
        debounceTime(100),
        tap(_ => {
          this.destroyTimer();
          const uiState = this.convoGroupQuery.getConvoUiState(this.livechat.conversationGroupId);

          if (!uiState?.viewingOlderMessage) {
            this.scrollToBottom();
          } else {
            if (this.isScrollToLatestSeenMessage) {
              this.isScrollToLatestSeenMessage = false;
              if (uiState.lastSeenMsgID) {
                this.scrollToMessage(uiState.lastSeenMsgID);
              }
            }
          }
        })
      );
    }
  }

  ngAfterViewInit(): void {
    this.trackingReconnect();
    this.trackingScrollEvent();
    this.saveViewDateFirstView();
  }

  diffDates(time1: number, time2: number) {
    return format(new Date(time1), 'dd/MM/yyyy') !== format(new Date(time2), 'dd/MM/yyyy');
  }

  startOver() {
    this.onStartOver.emit(true);
  }

  trackByIdx(_, item: ChatMessage) {
    return item.clientId;
  }

  onCreatedQuill(quill: Quill) {
    quill.focus();

    quill.on('text-change', () => {
      this.animation = false;
    });

    quill.keyboard.addBinding(
      {
        key: ENTER
      } as any,
      () => {
        // return true = continue because alots another Enter - key cases
        // return false = completed & stop
        let isContinue = true;
        if (!this.emptyEditor) {
          this.handleEnterMessage();
          isContinue = false;
        }
        return isContinue;
      }
    );
    const keys = (quill.keyboard as any).bindings;
    // replace index of Enter key to avoid conflict : lastest -> 2
    keys[ENTER].splice(1, 0, keys[ENTER].pop());

    quill.clipboard.addMatcher('img', (node: any, delta: Delta) => {
      const img = node?.src;
      if (img) {
        fetch(img)
          .then(r => r.blob())
          .then(blob => {
            const nameFile = blob.type.split('/')[1];
            const file = new File([blob], `Pasted_image_${new Date().getTime()}.${nameFile}`, { type: blob.type });
            this.uploadMultipleFiles([file], this.livechat);
          })
          .catch(_ => {
            this.toastService.error('Your URL image has been blocked by CORS policy!');
          });
      }
      delta.ops = [];
      return delta;
    });
  }

  upload(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.uploadMultipleFiles(files, this.livechat);
  }

  onAnswerQuestion(item) {
    const customer = this.customersQuery.getValue();
    const message = ChatMessage.createMessagePublic(
      this.livechat,
      new MessageBody({ text: item }),
      customer.chatCustomerId,
      MsgType.message
    );
    const sent = this.chatService.send(message);
    if (sent) {
      this.customersService.updateFlow([]);
      this.customersService.updateUI(<UIConfig>{
        waitingChatbot: true,
        showFooter: false
      });
      this.convoGroupService.updateConvoViewState(this.livechat.conversationGroupId, <ConversationGroupUI>{
        viewingOlderMessage: undefined,
        lastSeenMsgID: undefined
      });
    }
  }

  handleEnterMessage() {
    // prevent enter manual
    if (this.emptyEditor) {
      return;
    }

    if (this.websocketStatus === SocketStatus.opened) {
      const customer = this.customersQuery.getValue();
      const output = this.getContents();
      if (!output) {
        return;
      }
      const message = ChatMessage.createMessagePublic(
        this.livechat,
        new MessageBody({ text: output?.msg }),
        customer.chatCustomerId,
        MsgType.message
      );
      const sent = this.chatService.send(message);

      if (this.hasChatBox) {
        this.customersService.updateUI(<UIConfig>{
          waitingChatbot: true,
          showFooter: false
        });
      }
      if (sent) {
        const uiState = this.convoGroupQuery.getConvoUiState(this.livechat.conversationGroupId);
        if (uiState.lastSeenMsgID) {
          // scroll bottom
          this.convoGroupService.updateConvoViewState(this.livechat.conversationGroupId, <ConversationGroupUI>{
            lastSeenMsgID: undefined,
            viewingOlderMessage: false
          });
        }
      }
      this.editor.quillEditor.setText('');
    } else {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
    }
  }

  private saveViewDateFirstView() {
    if (this.viewport) {
      const array: HTMLDivElement[] = Array.from(this.viewport?.nativeElement.querySelectorAll('.msg-item'));
      const updatingState = <ConversationGroupUI>{
        viewDate: this.findViewDateFirstMessage(array, this.getMaxScrollTopViewportValue())
      };
      setTimeout(() => {
        this.convoGroupService.updateConvoViewState(this.livechat.conversationGroupId, updatingState);
      });
    } else {
      setTimeout(() => {
        this.saveViewDateFirstView();
      }, 500);
    }
  }

  private scrollToMessage(messageId: string, count = 0, idConversation?: string) {
    const $el = this.elr.nativeElement.querySelector(`[id='${messageId}']`);
    if ($el) {
      setTimeout(() => {
        $el.scrollIntoView({
          block: 'start'
        });
      }, 10);
    } else {
      count++;
      if (count < 5) {
        // retry
        setTimeout(() => {
          this.scrollToMessage(messageId, count, idConversation);
        }, 100);
      }
    }
  }

  private scrollToBottom() {
    let oldViewport = this.viewport?.nativeElement.scrollTop;
    this.timer$ = timer(0, 200).subscribe(_ => {
      const currentHeight = this.getMaxScrollTopViewportValue();
      if (oldViewport === currentHeight) {
        this.recoverStragery.increaseReconnectTime();
        if (!this.recoverStragery.canReconnect) {
          this.destroyTimer();
        }
      } else {
        oldViewport = currentHeight;
        const options = <ScrollToOptions>{
          top: this.getMaxScrollTopViewportValue(),
          block: 'end',
          // behavior: !this.hasAnswers ? 'auto' : 'smooth'
          behavior: 'smooth'
        };

        this.viewport?.nativeElement.scrollTo(options);
      }
    });
  }

  private getMaxScrollTopViewportValue() {
    return this.viewport?.nativeElement.scrollHeight - this.viewport?.nativeElement.clientHeight;
  }

  private getContents(): OutputContentQuill {
    const messageData = this.editor?.quillEditor?.getContents();
    let messageBuilder = '';
    const mentionArr: { denotationChar: string; id: string; index: string; value: string }[] = [];
    messageData?.ops.forEach(op => {
      const insert = op.insert as any;
      if (insert.emoji) {
        const findEmoji = EmojiList.find(x => x.name === insert.emoji);
        messageBuilder += findEmoji.shortname;
      } else {
        messageBuilder += insert.toString();
      }
    });
    messageBuilder = messageBuilder.trim();
    if (messageBuilder || mentionArr.length > 0) {
      const msg = this.markdownService.removeMentionEmojiOnMarkdown(messageBuilder, mentionArr);
      return new OutputContentQuill([], msg);
    } else {
      return null;
    }
  }

  private trackingWidgetDevice() {
    this.breakpointObserver
      .observe(['(max-width: 700px)', Breakpoints.HandsetLandscape])
      .pipe(
        switchMap((state: BreakpointState) => {
          let isMobile = state?.matches;
          if (detectMobile()) {
            isMobile = true;
          }
          this.customersService.updateUI(<UIConfig>{
            isMobile: isMobile
          });
          return this.breakpointObserver.observe([Breakpoints.HandsetLandscape]);
        }),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe((state: BreakpointState) => {
        this.customersService.updateUI(<UIConfig>{
          isLandscape: state?.matches
        });
      });
  }

  private uploadMultipleFiles(files: File[], whatsapp: ConversationGroup) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadFile(files, whatsapp, 0);
    }
  }

  private uploadFile(models: File[], whatsapp: ConversationGroup, index: number) {
    const dialog = this.dialog.open(UploadDialogComponent, {
      width: '500px',
      disableClose: true,
      data: <UploadDialogInput>{
        file: models[index],
        ticket: whatsapp,
        index: index + 1,
        max: models.length
      }
    });

    dialog.afterClosed().subscribe(
      _ => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, whatsapp, index);
        }
      },
      err => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, whatsapp, index);
        }
      }
    );
  }

  private destroyTimer() {
    this.timer$?.unsubscribe();
    this.timer$ = null;
    this.recoverStragery.reset();
  }

  private loadHistoryFirst() {
    this.loadingFirst = true;
    const reqHistory = <FilterConvoMessageReq>{
      conversations: [this.livechat.conversationGroupId],
      limit: DEFAULT_LIMIT
    };
    this.messageService
      .getWhatsappHistory(this.livechat.conversationGroupId, reqHistory)
      .pipe(
        tap(_ => {
          this.convoGroupService.updateConvoViewState(this.livechat.conversationGroupId, <ConversationGroupUI>{
            loaded: true
          });
        }),
        finalize(() => (this.loadingFirst = false))
      )
      .subscribe(data => {
        if (this.hasChatBox && data.messages.length > 0) {
          const message = data.messages[data.messages.length - 1];
          if (<string>message.ct === 'customer' || message.ct === ConvoType.customer) {
            if (message?.mt === MsgType.mcq) {
              this.customersService.updateUI(<UIConfig>{
                waitingChatbot: false,
                showFooter: false
              });
              this.animation = false;
              const answers = message?.body?.data;
              if (answers) {
                this.customersService.updateFlow(message?.body?.data);
              }
            } else if (message?.mt === MsgType.message && message.ut === UserType.System) {
              const customer = this.customersQuery.getValue()?.chatCustomerId;
              if (message.user !== customer) {
                this.customersService.updateUI(<UIConfig>{
                  waitingChatbot: false,
                  showFooter: true
                });
                this.animation = true;
                this.customersService.updateFlow([]);
              }
            } else if (message?.mt === MsgType.system) {
              if (message?.body?.data?.type === SystemMsgType.archived) {
                this.animation = false;
              }
            }
          }
        }

        this.customersService.updateUI(<UIConfig>{
          showFooter: !this.hasChatBox
        });
      });
  }

  private loadMoreAppend(callback?: Function) {
    const uiState = this.convoGroupQuery.getConvoUiState(this.livechat.conversationGroupId);
    if (uiState.reconnectAt) {
      const req = <FilterConvoMessageReq>{
        conversations: [this.livechat.conversationGroupId],
        fromMillis: uiState.toMillis,
        limit: DEFAULT_LIMIT
      };

      this.messageService.getWhatsappHistory(this.livechat.conversationGroupId, req).subscribe(
        history => {
          if (callback) {
            callback();
          }

          setTimeout(() => {
            this.isLoadingMoreAppend = false;
          });
        },
        _ => (this.isLoadingMoreAppend = false)
      );
    } else {
      this.isLoadingMoreAppend = false;
    }
  }

  private loadMorePrepend(callback?: Function) {
    const uiState = this.convoGroupQuery.getConvoUiState(this.livechat.conversationGroupId);
    if (uiState.hasMore) {
      const req = <FilterConvoMessageReq>{
        conversations: [this.livechat.conversationGroupId],
        toMillis: uiState.fromMillis,
        limit: DEFAULT_LIMIT
      };

      this.isScrollToLatestSeenMessage = true;
      this.messageService.getWhatsappHistory(this.livechat.conversationGroupId, req).subscribe(
        _ => {
          //  private  isScrollToLatestSeen = true;
          if (callback) {
            callback();
          }
          setTimeout(() => {
            this.isLoadingMorePrepend = false;
          }, 300);
        },
        _ => (this.isLoadingMorePrepend = false)
      );
    } else {
      this.isLoadingMorePrepend = false;
    }
  }

  // ===================== TRACKING =============================
  // support get history when reconnected ws
  private trackingReconnect() {
    this.convoGroupQuery
      .selectUIState(this.livechat.conversationGroupId, 'reconnectAt')
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(time => !!time)
      )
      .subscribe(_ => {
        const uiState = this.convoGroupQuery.getConvoUiState(this.livechat.conversationGroupId);
        if (uiState.loaded && !this.isLoadingMoreAppend) {
          this.isLoadingMoreAppend = true;
          this.loadMoreAppend(() => {
            if (uiState.hasMore) {
              this.isLoadingMoreAppend = true;
              this.loadMorePrepend();
            }
          });
        }

        if (!uiState.loaded) {
          this.loadHistoryFirst();
        }
      });
  }

  private trackingScrollEvent() {
    if (this.viewport) {
      let preValue;
      const onViewportScroll$ = fromEvent(this.viewport?.nativeElement, 'scroll').pipe(
        map((event: Event) => event.target['scrollTop'].valueOf()),
        share(),
        tap(value => {
          if (preValue == null) {
            preValue = value;
            return;
          }

          if (preValue > value) {
            this.destroyTimer();
          }
        })
      );

      setTimeout(() => {
        // update lastSeenMessage & viewDate
        onViewportScroll$
          .pipe(
            takeUntil(this.destroySubscriber$),
            filter(_ => !!this.viewport),
            debounceTime(200)
          )
          .subscribe(value => {
            this.updateConvoViewState(value);
          });

        // update viewingOlderMessage,enableScrollBottom,check lastSeenMsgID is undefined
        onViewportScroll$
          .pipe(
            takeUntil(this.destroySubscriber$),
            filter(_ => !!this.viewport),
            debounceTime(200)
          )
          .subscribe(value => {
            const isViewingOlderMessage = this.isViewingOlderMessage(value);
            const uiState = <ConversationGroupUI>{
              viewingOlderMessage: isViewingOlderMessage
            };
            if (!isViewingOlderMessage) {
              uiState.lastSeenMsgID = undefined;
            }
            this.convoGroupService.updateConvoViewState(this.livechat.conversationGroupId, uiState);
          });
      }, 500);

      // load to prepend or append
      onViewportScroll$.pipe(debounceTime(200), takeUntil(this.destroySubscriber$)).subscribe(value => {
        if (!this.isLoadingMorePrepend && value === 0) {
          // prepend
          this.isLoadingMorePrepend = true;
          this.loadMorePrepend();
        } else if (!this.isLoadingMoreAppend && !this.isViewingOlderMessage(value)) {
          // append
          this.isLoadingMoreAppend = true;
          this.loadMoreAppend();
        }
      });
    } else {
      setTimeout(() => {
        this.trackingScrollEvent();
      }, 10);
    }
  }

  private updateConvoViewState(topOffset: number) {
    const isViewingOlderMessage = this.isViewingOlderMessage(topOffset);
    const updatingState = <ConversationGroupUI>{};
    const array: HTMLDivElement[] = Array.from(this.viewport.nativeElement.querySelectorAll('.msg-item'));
    // update seen last message
    if (isViewingOlderMessage) {
      // 64x  is height of conversation-header component
      let indexTopMessage = array.findIndex((msg: HTMLElement) => msg.offsetTop + msg.clientHeight - 64 >= topOffset);
      indexTopMessage = indexTopMessage === undefined ? 0 : indexTopMessage === 0 ? 0 : indexTopMessage - 1;
      const clientId = array[indexTopMessage]?.id;

      updatingState.lastSeenMsgID = clientId;
    }

    // update view Date
    updatingState.viewDate = this.findViewDateFirstMessage(array, topOffset);
    this.convoGroupService.updateConvoViewState(this.livechat.conversationGroupId, updatingState);
  }

  private findViewDateFirstMessage(array: HTMLDivElement[], topOffset: number) {
    let viewDate = Date.parse(new Date().toString());
    if (array.length > 0) {
      const itemFirstViewed = array.find((msg: HTMLDivElement) => {
        return msg.offsetTop + msg.clientHeight + 18 >= topOffset;
      });
      if (itemFirstViewed) {
        viewDate = +itemFirstViewed.getAttribute('data-ts');
      } else {
        viewDate = +array[0].getAttribute('data-ts');
      }
    }
    return viewDate;
  }

  private isViewingOlderMessage(scrollTop: number) {
    const maxScrollValue = this.getMaxScrollTopViewportValue();
    // true => scroll to the last potision , false => sroll bottom
    return scrollTop < maxScrollValue - 14; // 28 is minimum of one text message
  }
}
