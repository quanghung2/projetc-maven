import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { ChannelState, Contact, ContactQuery, ContactService, ContactUI } from '@b3networks/api/contact';
import { GetReportV4Payload, Period, ReportV4Code, TxnChatLog, TxnStatusChat, V4Service } from '@b3networks/api/data';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  ConversationType,
  CustomerInfo,
  FilterConvoMessageReq,
  GroupType,
  HistoryMessageQuery,
  HistoryMessageService,
  MeQuery,
  MsgType,
  ReconnectChatStragery,
  Status,
  User,
  WindownActiveService
} from '@b3networks/api/workspace';
import {
  Txn,
  TxnQuery,
  TxnService,
  UploadDialogComponent,
  UploadDialogInput,
  UploadDialogV2Component
} from '@b3networks/chat/shared/core';
import { TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { Order } from '@datorama/akita';
import { format } from 'date-fns';
import { combineLatest, fromEvent, Observable, of, Subject, Subscription, timer } from 'rxjs';
import {
  debounceTime,
  distinctUntilKeyChanged,
  filter,
  map,
  share,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';

const DEFAULT_LIMIT_TXNS = 3;
const DEFAULT_LIMIT = 50;

@Component({
  selector: 'b3n-txns-content',
  templateUrl: './txns-content.component.html',
  styleUrls: ['./txns-content.component.scss']
})
export class TxnsContentComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  readonly MsgType = MsgType;

  @ViewChild('viewport') viewport: ElementRef | null;

  @Input() inboxUuid: string;
  @Input() contact: Contact;
  @Input() txns: Txn[];
  @Input() newestTxn: Txn;
  @Input() isArchived: boolean;

  loadingFirst: boolean;
  channel: ChatTypeTxn;
  messages: ChatMessage[] = [];
  loadingHistory$: Observable<boolean>;

  private isLoadingMoreAppend: boolean;
  private isLoadingMorePrepend: boolean;
  private isLoadOldTxn: boolean;
  private txnLatestLoaded: string; // txnUuid
  private timeZone: string;

  // handle scroll
  private recoverStragery = new ReconnectChatStragery({ reconnectTimes: 0, maxReconnect: 15 });
  private timer$: Subscription;

  // destroy$
  private _destroyHandleNextTxn$ = new Subject();
  private _destroySubscriber$ = new Subject();

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent | any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent | any) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files) as File[];

    if (this.newestTxn?.txnUuid && !this.newestTxn.isClosed) {
      const convo = this.convoGroupQuery.getEntity(this.newestTxn.txnUuid);
      if (convo) {
        this.uploadMultipleFiles(files, convo);
      }
    }
  }

  constructor(
    public elr: ElementRef,
    private meQuery: MeQuery,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private dialog: MatDialog,
    private messageQuery: HistoryMessageQuery,
    private messageService: HistoryMessageService,
    private contactService: ContactService,
    private contactQuery: ContactQuery,
    private txnService: TxnService,
    private txnQuery: TxnQuery,
    private windownActiveService: WindownActiveService,
    private chatService: ChatService,
    private v4Service: V4Service,
    private identityProfileQuery: IdentityProfileQuery,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['newestTxn']) {
      this.trackingReconnect();
    }
  }

  ngOnInit(): void {
    this.timeZone = this.identityProfileQuery.getProfileOrg(X.orgUuid)?.utcOffset;

    this.loadingHistory$ = this.messageQuery.selectLoading();

    this.channel = this.txns[0].channel;
    const uiChannel: ChannelState = this.contactQuery.getUiState(this.contact.uuid)[this.channel] || {};
    if (uiChannel?.loaded) {
      this.subscribeMessage$();
      this.loadingFirst = true;
      this.trackingScrollEvent();
      this.saveViewDateFirstView();
    } else {
      if (!this.inboxUuid) {
        const timeRange = TimeRangeHelper.buildTimeRangeFromKey(TimeRangeKey.last90days, this.timeZone);
        const req = <GetReportV4Payload>{
          startTime: timeRange.startDate,
          endTime: timeRange.endDate,
          orgUuid: X.orgUuid,
          filter: {
            status: 'end',
            'customer.customerUuid': this.contact.uuid,
            channel: this.channel
          }
        };
        this.getMoreOldTxnsAndGetHistoryFirst(req, new Pageable(1, DEFAULT_LIMIT_TXNS), uiChannel, () => {
          this.subscribeMessage$();
          this.loadingFirst = true;
          this.trackingScrollEvent();
          this.saveViewDateFirstView();
        });
      } else {
        this.getMoreOldTxnsAndGetHistoryFirstV2(uiChannel, () => {
          this.subscribeMessage$();
          this.loadingFirst = true;
          this.trackingScrollEvent();
          this.saveViewDateFirstView();
        });
      }
    }
  }

  ngAfterViewInit(): void {
    this.meQuery.me$.pipe(takeUntil(this._destroySubscriber$), take(1)).subscribe(me => {
      this.trackingSendSeen(me);
    });
  }

  ngOnDestroy() {
    this.destroyHandleNextTxn();

    this._destroySubscriber$.next(true);
    this._destroySubscriber$.complete();
  }

  trackByIdx(_: any, item: ChatMessage): string {
    return item.clientId;
  }

  diffDates(time1: number, time2: number) {
    return format(new Date(time1), 'dd/MM/yyyy') !== format(new Date(time2), 'dd/MM/yyyy');
  }

  private subscribeMessage$() {
    this.selectTxnLoaded(this.contact.uuid)
      .pipe(distinctUntilKeyChanged('handleNextTxn'), takeUntil(this._destroySubscriber$))
      .subscribe(({ txnsLoaded, handleNextTxn }) => {
        this.destroyHandleNextTxn();
        if (txnsLoaded.length === 0) {
          this.getHistoryTxn(this.newestTxn.txnUuid).subscribe();
        } else {
          this.txnLatestLoaded = txnsLoaded[txnsLoaded.length - 1];
          this._destroyHandleNextTxn$ = new Subject();
          this.convoGroupQuery
            .selectUIState(this.txnLatestLoaded, 'loaded')
            .pipe(
              filter(loaded => loaded),
              switchMap(_ => this.convoGroupQuery.selectUIState(this.txnLatestLoaded, 'hasMore')),
              filter(hasMore => !hasMore),
              takeUntil(this._destroySubscriber$),
              takeUntil(this._destroyHandleNextTxn$),
              take(1)
            )
            .subscribe(_ => {
              if (handleNextTxn) {
                this.getHistoryTxn(handleNextTxn).subscribe();
              } else {
                this.isLoadOldTxn = true;
              }
            });
        }
      });

    let tapFirst = true;
    this.selectTxnLoaded(this.contact.uuid)
      .pipe(
        distinctUntilKeyChanged('handleNextTxn'),
        switchMap(({ txnsLoaded }) => {
          return txnsLoaded.length > 0 ? this.messageQuery.selectMsgByListConvo(txnsLoaded) : of([]);
        }),
        debounceTime(50),
        takeUntil(this._destroySubscriber$)
      )
      .subscribe(messages => {
        this.messages = messages;
        this.cdr.detectChanges();

        this.destroyTimer();

        const uiState = this.contactQuery.getUiState(this.contact.uuid);

        if (!uiState?.viewingOlderMessage) {
          this.scrollToBottom();
        } else {
          if (uiState.lastSeenMsgID) {
            this.scrollToMessage(uiState.lastSeenMsgID);
          }
        }

        if (tapFirst) {
          tapFirst = false;
          this.intervalLoadMoreWhenNoScrollBar();
        }
      });
  }

  private intervalLoadMoreWhenNoScrollBar() {
    if (!this.viewport) {
      setTimeout(() => {
        this.intervalLoadMoreWhenNoScrollBar();
      }, 500);
      return;
    }

    if (this.hasScrollbarViewport()) {
      return;
    }

    if (!this.isLoadOldTxn) {
      setTimeout(() => {
        this.intervalLoadMoreWhenNoScrollBar();
      }, 500);
      return;
    }

    if (!this.isLoadingMorePrepend) {
      this.isLoadingMorePrepend = true;
      this.loadMorePrepend(() => {
        setTimeout(() => {
          this.intervalLoadMoreWhenNoScrollBar();
        }, 500);
      });
    } else {
      setTimeout(() => {
        this.intervalLoadMoreWhenNoScrollBar();
      }, 500);
    }
  }

  private selectTxnLoaded(customerUuid: string) {
    return this.txnQuery
      .selectTxnsByCustomer(
        customerUuid,
        this.txns?.[0]?.inboxUuid,
        this.isArchived ? 'closed' : 'all',
        this.channel,
        Order.DESC
      )
      .pipe(
        filter(x => x.length > 0),
        debounceTime(20),
        switchMap(txns => {
          const txnUuidsSorted = txns.map(x => x.txnUuid);
          return combineLatest([
            of(txnUuidsSorted),
            this.convoGroupQuery.selectListConvoUiState(txnUuidsSorted).pipe(debounceTime(50))
          ]);
        }),
        map(([txnUuidsSorted, convosUi]) => {
          const txnsLoaded = [];
          let handleNextTxn: string;
          for (let i = 0; i < txnUuidsSorted.length; i++) {
            const ui = convosUi.find(x => x.conversationGroupId === txnUuidsSorted[i]);
            if (ui?.loaded) {
              txnsLoaded.push(txnUuidsSorted[i]);
              if (ui?.hasMore) {
                handleNextTxn = txnUuidsSorted[i + 1];
                break;
              }
              continue;
            } else {
              handleNextTxn = txnUuidsSorted[i];
              break;
            }
          }
          return { txnsLoaded, handleNextTxn: handleNextTxn };
        })
      );
  }

  private getMoreOldTxnsAndGetHistoryFirst(
    req: GetReportV4Payload,
    pageable: Pageable,
    uiChannelState: ChannelState,
    cb: () => void
  ) {
    this.v4Service
      .getReportData<TxnChatLog>(Period.dump, ReportV4Code.chatUnifiedHistory, req, pageable, false)
      .pipe(
        map(resp => resp?.rows || []),
        tap(data => {
          // store txns
          const txns = data.map(item => {
            const txn = new Txn(<Partial<Txn>>{
              txnUuid: item.txnUuid,
              txnType: TxnType.chat,
              lastAssignedAgents: item?.agentUuids,
              customerUuid: item.customer?.customerUuid,
              createdAt: item.time,
              channel: item.channel,
              unreadCount: 0,
              metadata: {}
            });
            if (item.status === TxnStatusChat.end) {
              txn.closed = true;
            }
            return txn;
          });
          this.txnService.updateTxns2Store(txns);

          const state = <ChannelState>{
            ...uiChannelState,
            loaded: true,
            page: pageable.page,
            perPage: pageable.perPage,
            hasMore: txns.length === pageable.perPage
          };
          this.contactService.updateUIViewState(
            this.contact.uuid,
            this.channel === ChatTypeTxn.livechat
              ? <ContactUI>{
                  livechat: state
                }
              : <ContactUI>{
                  whatsapp: state
                }
          );

          this.initConvoFromTxn(txns);
        }),
        switchMap(txns => (txns.length > 0 ? this.getHistoryTxn(txns[0].txnUuid) : of(null)))
      )
      .subscribe(_ => cb());
  }

  private getMoreOldTxnsAndGetHistoryFirstV2(uiChannelState: ChannelState, cb: () => void) {
    const state = <ChannelState>{
      ...uiChannelState,
      loaded: true,
      page: 1,
      perPage: DEFAULT_LIMIT_TXNS,
      hasMore: false
    };
    this.contactService.updateUIViewState(
      this.contact.uuid,
      this.channel === ChatTypeTxn.livechat
        ? <ContactUI>{
            livechat: state
          }
        : <ContactUI>{
            whatsapp: state
          }
    );

    const txns = this.txnQuery.getAll({
      filterBy: entity => entity.inboxUuid === this.inboxUuid && entity.customerUuid === this.contact.uuid,
      limitTo: 1,
      sortBy: 'createdAt',
      sortByOrder: Order.DESC
    });
    if (txns?.length > 0) {
      this.getHistoryTxn(txns[0].txnUuid);
    }
    cb();
  }

  private initConvoFromTxn(txns: Txn[]) {
    const chat = txns.filter(x => x.txnType === TxnType.chat);

    const userUuid = this.meQuery.getMe().userUuid;
    chat.forEach(item => {
      const store = this.convoGroupQuery.getEntity(item.txnUuid);
      if (!store) {
        this.addConversation2Store(item);
      }
      if (item.channel === ChatTypeTxn.whatsapp && !store?.whatsappLastReceivedDate) {
        this.convoGroupService
          .getWhatsAppLiveChatDetail(
            item.txnUuid,
            this.contact,
            userUuid,
            GroupType.WhatsApp,
            item.isClosed ? Status.archived : Status.opened
          )
          .subscribe();
      }
    });
  }

  private addConversation2Store(txn: Txn) {
    const convo = new ConversationGroup(<Partial<ConversationGroup>>{
      conversationGroupId: txn.txnUuid,
      conversations: [
        {
          conversationId: txn.txnUuid,
          conversationType: ConversationType.public,
          members: []
        }
      ],
      customerInfo: <CustomerInfo>{
        uuid: this.contact?.uuid,
        name: this.contact?.displayName
      },
      createdAt: new Date(),
      status: txn.isClosed ? Status.archived : Status.opened,
      type: txn.channel === ChatTypeTxn.livechat ? GroupType.Customer : GroupType.WhatsApp
    });

    this.convoGroupService.addConversation2Store(convo);
  }

  // ===================== Handle scrollbar =============================
  private scrollToMessage(messageId: string, count = 0, idConversation?: string) {
    const $el = this.elr.nativeElement.querySelector(`[id='${messageId}']`);
    if ($el) {
      $el.scrollIntoView({
        block: 'start'
      });
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
          behavior: 'auto'
        };

        this.viewport?.nativeElement.scrollTo(options);
      }
    });
  }

  private getMaxScrollTopViewportValue() {
    return this.viewport?.nativeElement.scrollHeight - this.viewport?.nativeElement.clientHeight;
  }

  private hasScrollbarViewport() {
    return this.viewport?.nativeElement.scrollHeight > this.viewport?.nativeElement.clientHeight;
  }

  private destroyTimer() {
    this.timer$?.unsubscribe();
    this.timer$ = null;
    this.recoverStragery.reset();
  }

  private destroyHandleNextTxn() {
    this._destroyHandleNextTxn$.next(true);
    this._destroyHandleNextTxn$.complete();
  }

  // ===================== upload file =============================
  private uploadMultipleFiles(files: File[], convo: ConversationGroup) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      if (this.newestTxn.channel === ChatTypeTxn.whatsapp) {
        this.uploadFileV2(files, convo, 0);
      } else {
        // livechat
        this.uploadFile(files, convo, 0);
      }
    }
  }

  // ===================== get History and Txn =============================
  private loadMorePrepend(callback?: Function) {
    const uiState = this.convoGroupQuery.getConvoUiState(this.txnLatestLoaded);
    if (this.txnLatestLoaded && uiState.loaded) {
      if (uiState.hasMore) {
        const req = <FilterConvoMessageReq>{
          conversations: [this.txnLatestLoaded],
          toMillis: uiState.fromMillis,
          limit: DEFAULT_LIMIT
        };

        this.messageService.getWhatsappHistory(this.txnLatestLoaded, req).subscribe(
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
        console.log('this.isLoadOldTxn: ', this.isLoadOldTxn);
        if (this.isLoadOldTxn) {
          // load more older-txns
          const channelState: ChannelState = this.contactQuery.getUiState(this.contact.uuid)[this.channel] || {};
          console.log('channelState?.hasMore: ', channelState?.hasMore);
          if (channelState?.hasMore) {
            // getMore old txns
            const timeRange = TimeRangeHelper.buildTimeRangeFromKey(TimeRangeKey.last90days, this.timeZone);
            const req = <GetReportV4Payload>{
              startTime: timeRange.startDate,
              endTime: timeRange.endDate,
              orgUuid: X.orgUuid,
              filter: {
                status: 'end',
                'customer.customerUuid': this.contact.uuid,
                channel: this.channel
              }
            };
            if (!this.inboxUuid) {
              this.getMoreOldTxnsAndGetHistoryFirst(
                req,
                new Pageable(channelState.page + 1, DEFAULT_LIMIT_TXNS),
                channelState,
                () => {
                  this.isLoadOldTxn = false;
                  this.isLoadingMorePrepend = false;
                }
              );
            } else {
              this.getMoreOldTxnsAndGetHistoryFirstV2(channelState, () => {
                this.isLoadOldTxn = false;
                this.isLoadingMorePrepend = false;
              });
            }
            return;
          }
        }
        this.isLoadingMorePrepend = false;
      }
    } else {
      this.isLoadingMorePrepend = false;
    }
  }

  private getHistoryTxn(txnUuid: string) {
    const uiState = this.convoGroupQuery.ui.getEntity(txnUuid);
    if (uiState?.loaded) {
      return of(null);
    }

    const req = <FilterConvoMessageReq>{
      conversations: [txnUuid],
      limit: DEFAULT_LIMIT
    };
    return uiState?.joined
      ? this.messageService.getWhatsappHistory(txnUuid, req).pipe(
          tap(_ => {
            this.convoGroupService.updateConvoViewState(txnUuid, <ConversationGroupUI>{
              loaded: true
            });
          })
        )
      : this.txnService.join(txnUuid).pipe(
          switchMap(_ => this.messageService.getWhatsappHistory(txnUuid, req)),
          tap(_ => {
            this.convoGroupService.updateConvoViewState(txnUuid, <ConversationGroupUI>{
              loaded: true,
              joined: true
            });
          })
        );
  }

  // ===================== TRACKING =============================
  // support get history when reconnected ws
  private trackingReconnect() {
    // this.convoGroupQuery
    //   .selectUIState(this.latestTxn.txnUuid, 'reconnectAt')
    //   .pipe(
    //     takeUntil(this.destroySubscriber$),
    //     filter(time => !!time)
    //   )
    //   .subscribe(_ => {
    //     const uiState = this.convoGroupQuery.getConvoUiState(this.latestTxn.txnUuid);
    //     if (uiState.loaded && !this.isLoadingMoreAppend) {
    //       this.isLoadingMoreAppend = true;
    //       this.loadMoreAppend(() => {
    //         if (uiState.hasMore) {
    //           this.isLoadingMoreAppend = true;
    //           this.loadMorePrepend();
    //         }
    //       });
    //     }
    //     if (!uiState.loaded) {
    //       this.loadHistoryFirst();
    //     }
    //   });
  }

  private trackingScrollEvent() {
    if (this.viewport) {
      let preValue;
      const onViewportScroll$ = fromEvent(this.viewport?.nativeElement, 'scroll').pipe(
        map(event => (<Event>event).target['scrollTop'].valueOf()),
        share(),
        tap(value => {
          if (preValue == null) {
            preValue = value;
            return;
          }

          if (preValue > value) {
            this.destroyTimer();
          } else {
            preValue = value;
          }
        })
      );

      setTimeout(() => {
        // update lastSeenMessage & viewDate
        onViewportScroll$
          .pipe(
            takeUntil(this._destroySubscriber$),
            filter(_ => !!this.viewport),
            debounceTime(200)
          )
          .subscribe(value => {
            this.updateConvoViewState(value);
          });

        // update viewingOlderMessage,enableScrollBottom,check lastSeenMsgID is undefined
        onViewportScroll$
          .pipe(
            takeUntil(this._destroySubscriber$),
            filter(_ => !!this.viewport),
            debounceTime(200)
          )
          .subscribe(value => {
            if (this.isLoadingMoreAppend || this.isLoadingMorePrepend) {
              return;
            }
            const isViewingOlderMessage = this.isViewingOlderMessage(value);
            const uiState = <ContactUI>{
              viewingOlderMessage: isViewingOlderMessage
            };
            if (!isViewingOlderMessage) {
              uiState.lastSeenMsgID = undefined;
            }
            this.contactService.updateUIViewState(this.contact.uuid, uiState);
          });
      }, 500);

      setTimeout(() => {
        // load to prepend or append
        onViewportScroll$.pipe(debounceTime(200), takeUntil(this._destroySubscriber$)).subscribe(value => {
          if (!this.isLoadingMorePrepend && value === 0) {
            // prepend
            this.isLoadingMorePrepend = true;
            this.loadMorePrepend();
          }
          // else if (!this.isLoadingMoreAppend && !this.isViewingOlderMessage(value)) {
          //   // append
          //   this.isLoadingMoreAppend = true;
          //   // this.loadMoreAppend();
          // }
        });
      }, 2000);
    } else {
      setTimeout(() => {
        this.trackingScrollEvent();
      }, 10);
    }
  }

  private isViewingOlderMessage(scrollTop: number) {
    const maxScrollValue = this.getMaxScrollTopViewportValue();
    // true => scroll to the last potision , false => sroll bottom
    return scrollTop < maxScrollValue - 14; // 28 is minimum of one text message
  }

  private saveViewDateFirstView() {
    if (this.viewport) {
      const array: HTMLDivElement[] = Array.from(this.viewport?.nativeElement.querySelectorAll('.msg-item'));
      const updatingState = <ConversationGroupUI>{
        viewDate: this.findViewDateFirstMessage(array, this.getMaxScrollTopViewportValue())
      };
      setTimeout(() => {
        this.contactService.updateUIViewState(this.contact.uuid, updatingState);
      });
    } else {
      setTimeout(() => {
        this.saveViewDateFirstView();
      }, 500);
    }
  }

  private updateConvoViewState(topOffset: number) {
    const isViewingOlderMessage = this.isViewingOlderMessage(topOffset);
    const updatingState = <ContactUI>{};
    const array: HTMLDivElement[] = Array.from(this.viewport.nativeElement.querySelectorAll('.msg-item'));
    // update seen last message
    if (isViewingOlderMessage) {
      let indexTopMessage = array.findIndex((msg: HTMLElement) => msg.offsetTop + msg.clientHeight - 64 >= topOffset);
      indexTopMessage = indexTopMessage === undefined ? 0 : indexTopMessage === 0 ? 0 : indexTopMessage - 1;
      const clientId = array[indexTopMessage]?.id;

      updatingState.lastSeenMsgID = clientId;
    }

    // update view Date
    updatingState.viewDate = this.findViewDateFirstMessage(array, topOffset);
    this.contactService.updateUIViewState(this.contact.uuid, updatingState);
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

  private trackingSendSeen(me: User) {
    timer(0, 3000)
      .pipe(
        takeUntil(this._destroySubscriber$),
        filter(_ => !!this.viewport && this.windownActiveService.windowActiveStatus)
      )
      .subscribe(_ => {
        const scrollTop = this.viewport?.nativeElement.scrollTop;
        const deta = this.getMaxScrollTopViewportValue() - scrollTop;
        if (deta < 20 && this.newestTxn?.unreadCount > 0) {
          const isMemberTxn = this.newestTxn?.lastAssignedAgents?.findIndex(x => x === me?.identityUuid) > -1;
          if (isMemberTxn) {
            const convo = this.convoGroupQuery.getEntity(this.newestTxn.txnUuid);
            const message = ChatMessage.createSeenMessage(convo);
            this.chatService.send(message);
          }
        }
      });
  }

  uploadFile(models: File[], convo: ConversationGroup, index: number) {
    if (!convo || (convo && convo.type === GroupType.SMS)) {
      return;
    }

    const dialog = this.dialog.open(UploadDialogComponent, {
      width: '500px',
      disableClose: true,
      data: <UploadDialogInput>{
        file: models[index],
        ticket: convo,
        index: index + 1,
        max: models.length
      }
    });

    dialog.afterClosed().subscribe(
      _ => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, convo, index);
        }
      },
      err => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, convo, index);
        }
      }
    );
  }

  uploadFileV2(models: File[], convo: ConversationGroup, index: number) {
    if (!convo || (convo && convo.type === GroupType.SMS)) {
      return;
    }

    const dialog = this.dialog.open(UploadDialogV2Component, {
      width: '500px',
      disableClose: true,
      data: <UploadDialogInput>{
        file: models[index],
        ticket: convo,
        index: index + 1,
        max: models.length
      }
    });

    dialog.afterClosed().subscribe(
      _ => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFileV2(models, convo, index);
        }
      },
      err => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFileV2(models, convo, index);
        }
      }
    );
  }
}
