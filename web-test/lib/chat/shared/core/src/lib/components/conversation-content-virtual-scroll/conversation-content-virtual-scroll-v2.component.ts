import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApprovalWorkspaceService } from '@b3networks/api/approval';
import {
  ActiveIframeService,
  Channel,
  ChannelType,
  ChannelUI,
  ChatMessage,
  ChatService,
  ConfigStore,
  ConversationGroup,
  FilterConvoMessageRangeRequest,
  FilterConvoMessageReq,
  GroupType,
  HistoryMessage,
  HistoryMessageQuery,
  HistoryMessageRange,
  HistoryMessageService,
  IParticipant,
  MeQuery,
  MessageBody,
  MsgType,
  NetworkService,
  SocketStatus,
  SystemMessageData,
  SystemMsgType,
  SystemType,
  TimeService,
  User,
  ViewUIStateCommon,
  WindownActiveService
} from '@b3networks/api/workspace';
import { randomGuid, X } from '@b3networks/shared/common';
import { Order } from '@datorama/akita';
import { Datasource, IDatasource } from 'ngx-ui-scroll';
import { BehaviorSubject, combineLatest, from, fromEvent, Observable, Subject, timer } from 'rxjs';
import { debounceTime, filter, map, share, take, takeUntil, tap } from 'rxjs/operators';
import { RegExpPattern } from '../../core/constant/patterns.const';
import { MessageReceiveProcessor } from '../../core/service/message-receive.processor';
import { PreviewHistoryMessageQuery } from '../../core/service/preview-history-message/preview-history-message.query';
import { PreviewHistoryMessageService } from '../../core/service/preview-history-message/preview-history-message.service';
import { TxnQuery } from '../../core/service/txn/txn.query';
import { InfoShowMention } from '../../core/state/app-state.model';
import { AppQuery } from '../../core/state/app.query';
import { AppService } from '../../core/state/app.service';
import {
  InteractiveDialogComponent,
  InteractiveDialogData
} from '../dialog/interactive-dialog/interactive-dialog.component';
import { SupportedConvo } from './../../core/adapter/convo-helper.service';
import {
  DATA_INIT_V2,
  DATA_SOURCE_BUFFER_SIZE,
  DATA_SOURCE_START_INDEX,
  DEFAULT_LIMIT,
  HANDLE_SYSTEMS_V2,
  InfoMessage,
  ItemAdapter,
  PositionScroll,
  QueryDataScroll,
  SCROLL_DEV_SETTINGS,
  Settings
} from './constant';

@Component({
  template: ''
})
export abstract class ConversationContentVirtualScrollV2Component implements OnDestroy {
  readonly SocketStatus = SocketStatus;
  readonly MsgType = MsgType;

  // wait,loading,prevent,block,index
  private _isLoadingMoreTop: boolean;
  private _isLoadingMoreBottom: boolean;
  private _root: number; // time initial load compo or time last seen message
  private _indexRoot: number;
  private _useStorePreviewHistory: boolean;

  // handle scroll
  protected destroyComponent$ = new Subject();
  protected destroyConvo$ = new Subject();
  private _clipScroll$ = new BehaviorSubject<PositionScroll>(PositionScroll.none);
  private _destroyReconcileWS$ = new Subject();
  private _destroyActiveApp$ = new Subject();
  private _destroySubscriber$ = new Subject();
  private _preventScrollBottom = false;
  private _settingScroll = <Settings>{
    bufferSize: DATA_SOURCE_BUFFER_SIZE,
    startIndex: DATA_SOURCE_START_INDEX - DATA_INIT_V2,
    minIndex: null,
    maxIndex: null,
    inverse: true,
    infinite: true
  };

  isViewLastSeen: boolean;
  isShowNewMessage = true;
  jumpToMessage: string;
  hoverMessage: string;
  reloadView = true;
  editingMessageId: string;
  newMessageId: string;
  loadingHistory$: Observable<boolean>;
  enableScrollBottom$: Observable<boolean>;
  errApiLoadFirst: boolean;
  errApiLoadFirst401: boolean;
  refetchHistory$: Observable<boolean>;

  // ngx-ui-scroll
  datasource: IDatasource;

  @Output() focusQuill = new EventEmitter<boolean>();

  @ViewChild('viewport') viewport: ElementRef | null;

  constructor(
    protected messageQuery: HistoryMessageQuery,
    protected messageService: HistoryMessageService,
    protected chatService: ChatService,
    public elr: ElementRef,
    private timeService: TimeService,
    private messageReceiveProcessor: MessageReceiveProcessor,
    protected meQuery: MeQuery,
    private windownActiveService: WindownActiveService,
    private txnQuery: TxnQuery,
    private networkService: NetworkService,
    private previewHistoryMessageService: PreviewHistoryMessageService,
    private previewHistoryMessageQuery: PreviewHistoryMessageQuery,
    private activeIframeService: ActiveIframeService,
    private approvalWorkspaceService: ApprovalWorkspaceService,
    protected dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    protected appQuery: AppQuery,
    protected appService: AppService
  ) {}

  abstract get id();

  abstract get convo(): SupportedConvo;

  abstract getHistories$(id: string, req: FilterConvoMessageReq): Observable<HistoryMessage>;

  abstract getRangeHistories$(
    req: FilterConvoMessageRangeRequest,
    config: ConfigStore
  ): Observable<HistoryMessageRange>;

  abstract addMsgLeaveUserDM();

  abstract selectUiState$<K extends keyof ViewUIStateCommon>(propety?: K): Observable<ViewUIStateCommon[K]>;

  abstract selectParticipiants$(): Observable<IParticipant[]>;

  abstract getUIState(id: string): ViewUIStateCommon;

  abstract selectIsDisconnected$(): Observable<boolean>;

  abstract isDisconnectedStore(): boolean;

  abstract updateUIState(id: string, newState: Partial<ViewUIStateCommon>);

  abstract updateChannel(id: string, newState: Partial<SupportedConvo>);

  abstract resetUIState(id: string);

  protected onConvoChanged() {
    this.updateUIState(this.id, <ChannelUI>{ needReceiveLiveMessage: true });
    this.errApiLoadFirst = false;
    this._useStorePreviewHistory = false;
    this.hoverMessage = null;
    this.newMessageId = null;
    this.loadingHistory$ = combineLatest([
      this.messageQuery.selectLoading(),
      this.previewHistoryMessageQuery.selectLoading()
    ]).pipe(map(loads => loads[0] || loads[1]));
    this.enableScrollBottom$ = this.selectUiState$('enableScrollBottom');

    this.flowLoadHistory();
  }

  ngOnDestroy(): void {
    this._destroyReconcileWS$.next(true);
    this._destroyReconcileWS$.unsubscribe();
    this._destroyActiveApp$.next(true);
    this._destroyActiveApp$.unsubscribe();
    this.destroyConvo$.next(true);
    this.destroyConvo$.unsubscribe();
    this.destroyComponent$.next(true);
    this.destroyComponent$.unsubscribe();
    this._destroySubscriber$.next(true);
    this._destroySubscriber$.unsubscribe();
  }

  trackByIdx(_: number, message: ChatMessage) {
    return message.clientId;
  }

  refetchHistory() {
    if (this.errApiLoadFirst401) {
      this.timeService.getTsTime().subscribe(
        () => {
          this.flowLoadHistory();
        },
        (err: HttpErrorResponse) => {
          if (err?.status === 401 && err?.error === 'invalid-token') {
            this.chatService.clearWs();
            this.chatService.initChat({ orgUuid: X.orgUuid, bypass: true }).subscribe();
          }
        }
      );
    } else {
      this.flowLoadHistory();
    }
  }

  onShowProfile(event: InfoShowMention) {
    this.appService.update({
      memberMenu: <InfoShowMention>{
        ...event,
        convo: this.convo
      }
    });
  }

  focusQuillEditor() {
    this.focusQuill.emit(true);
  }

  onMenuClosed() {
    const menu = this.elr.nativeElement.querySelector('.trigger-mention-menu') as HTMLElement;
    if (menu) {
      menu.style.display = 'none';
    }
  }

  async scrollToLastestMessage() {
    // if (this.newMessageId) {
    //   const info =
    //     this.messageQuery.getEntity(this.newMessageId) || this.previewHistoryMessageQuery.getEntity(this.newMessageId);
    //   if (info) {
    //     const tsLastview = (<InfoMessage>this.datasource.adapter?.lastVisible?.data)?.current?.ts;
    //     if (tsLastview < info.ts) {
    //       // scroll to new msg
    //       this.updateUIState(this.id, <ChannelUI>{
    //         lastSeenMsgID: this.newMessageId,
    //         viewingOlderMessage: false,
    //         enableScrollBottom: false,
    //         loadedFirst: false
    //       });
    //       this.updateUIState(this.id, {});

    //       this.flowLoadHistory();
    //       return;
    //     }
    //   }
    // }

    if (!this._useStorePreviewHistory && this.datasource?.adapter?.eof) {
      await this.datasource.adapter.relax();
      await this.datasource.adapter.fix({ scrollPosition: +Infinity });
    } else {
      this.updateUIState(this.id, <ChannelUI>{
        newMessage: null,
        lastSeenMsgID: undefined,
        viewingOlderMessage: false,
        enableScrollBottom: false,
        loadedFirst: false
      });
      this.flowLoadHistory();
    }
  }

  private async handleScrollBottomView() {
    const uiState = this.getUIState(this.id);
    if (!this._preventScrollBottom && !this._useStorePreviewHistory && !uiState.lastSeenMsgID) {
      await this.datasource.adapter.relax();
      await this.datasource.adapter.fix({ scrollPosition: +Infinity });
    }
  }

  // =================== RECEIVE MSG FROM WS =======================
  private listenNewMessageFromWS() {
    // receive message
    this.messageReceiveProcessor
      .onmessage()
      .pipe(
        takeUntil(this.destroyConvo$),
        filter(
          msg =>
            msg.convo === this.id &&
            !!this.datasource &&
            (msg.isStore ||
              (msg.isNoStore && HANDLE_SYSTEMS_V2.indexOf(msg.st) > -1) ||
              (msg?.isNoStore && msg.mt === MsgType.imess)) &&
            [SystemType.SEEN, SystemType.STATUS].indexOf(msg?.st) === -1 && // check seen & status
            (<SystemMessageData>msg?.body?.data)?.type !== SystemMsgType.typing // check typing
        )
      )
      .subscribe(message => {
        this.processMsg(message);
      });
  }

  private async processMsg(message: ChatMessage) {
    const isDisconnected = this.isDisconnectedStore();
    if (isDisconnected) {
      return;
    }

    if (message?.isNoStore && message.mt === MsgType.imess) {
      this.dialog.open(InteractiveDialogComponent, {
        data: <InteractiveDialogData>{
          message: message,
          channel: this.convo
        },
        disableClose: true,
        minWidth: '500px'
      });
      return;
    }

    if (message.st) {
      this.handleSystemMessage(message);
    } else {
      // add message
      if (message.isStore) {
        let updated = false;

        if (message.id) {
          await this.datasource.adapter.relax();
          await this.datasource.adapter.fix({
            updater: ({ data }) => {
              if (!(data as InfoMessage).current.id && (data as InfoMessage).current.client_ts === message.client_ts) {
                (data as InfoMessage).current = message;
                updated = true;
              }
            }
          });
        }

        if (!updated) {
          await this.datasource.adapter.relax();
          this.datasource.adapter.fix({ maxIndex: +Infinity });
          await this.datasource.adapter.relax();
          this.viewport?.nativeElement.dispatchEvent(new Event('scroll'));

          // scroll bottom if message of me
          const me = this.meQuery.getMe();
          if (message.user === me.userUuid) {
            if (!this._useStorePreviewHistory) {
              await this.datasource.adapter.relax();
              await this.datasource.adapter.fix({ scrollPosition: +Infinity });
            } else {
              this.updateUIState(this.id, <ChannelUI>{
                newMessage: null,
                lastSeenMsgID: undefined,
                viewingOlderMessage: false,
                enableScrollBottom: false,
                loadedFirst: false
              });
              this.flowLoadHistory();
            }
          }
        }
      }
    }
  }

  private async handleSystemMessage(message: ChatMessage) {
    const id = this.id;
    const { adapter } = this.datasource;
    let isEdited: boolean;
    switch (message.st) {
      case SystemType.EDIT:
        await adapter.relax();
        await adapter.fix({
          updater: item => {
            if ((<InfoMessage>item.data).current.clientId === message.clientId) {
              isEdited = true;
              (<InfoMessage>item.data).current = message;
            }
          }
        });
        if (isEdited) {
          // scroll bottom if msg is webhood
          if (message.body.data) {
            const urlMatched = message.body.text?.match(RegExpPattern.URL);
            const uiState = this.getUIState(this.id);
            if (!uiState.viewingOlderMessage && urlMatched) {
              setTimeout(() => {
                //  still stay this convo
                if (id === this.id) {
                  this.datasource.adapter.fix({ scrollPosition: +Infinity });
                  this.doCheck();
                }
              }, 0);
            }
          } else {
            this.doCheck();
          }
        }
        break;
      case SystemType.DELETE:
        if (message.id) {
          if (message.mt === MsgType.system) {
            return;
          }
          let isDelete: boolean;
          await adapter.relax();
          await adapter.fix({
            updater: item => {
              if ((<InfoMessage>item.data).current.clientId === message.clientId) {
                isDelete = true;
                (<InfoMessage>item.data).current = message;
              }
            }
          });
          if (isDelete) {
            this.doCheck();
            setTimeout(() => {
              this.handleScrollBottomView();
            }, 0);
          }
        } else {
          let index;
          await adapter.relax();
          await adapter.remove(item => {
            if (
              !(<InfoMessage>item.data).current.id &&
              (<InfoMessage>item.data).current.client_ts === message.client_ts
            ) {
              index = item.$index;
              return true;
            }
            return false;
          });
          if (index != null) {
            // success, update pre for next item
            let pre;
            await adapter.relax();
            await adapter.fix({
              updater: item => {
                if (item.$index === index - 1) {
                  pre = (<InfoMessage>item.data).current;
                } else if (item.$index === index) {
                  (<InfoMessage>item.data).preMessage = pre;
                }
              }
            });
            await adapter.relax();
            await adapter.clip({
              backwardOnly: true
            });
            setTimeout(() => {
              this.handleScrollBottomView();
            }, 0);
          }
        }
        break;
      case SystemType.PURGE:
        let index1;
        await adapter.relax();
        await adapter.remove(item => {
          if ((<InfoMessage>item.data).current.clientId === message.clientId) {
            index1 = item.$index;
            return true;
          }
          return false;
        });
        if (index1 != null) {
          // success, update pre for next item
          let pre;
          await adapter.relax();
          await adapter.fix({
            updater: item => {
              if (item.$index === index1 - 1) {
                pre = (<InfoMessage>item.data).current;
              } else if (item.$index === index1 && pre) {
                (<InfoMessage>item.data).preMessage = pre;
              }
            }
          });
          await adapter.relax();
          await adapter.clip({
            backwardOnly: true
          });
          setTimeout(() => {
            this.handleScrollBottomView();
          }, 0);
          this.doCheck();
        }
        break;
    }
  }

  private doCheck() {
    setTimeout(() => {
      this.datasource.adapter.relax(() => {
        this.datasource.adapter.check();
      });
    });
  }

  // =================== RECEIVE MSG FROM WS =======================
  // ============== GET HISTORY ======================
  async checkAndNavigateMsg(jumpToMessage: string) {
    const elementMsg: HTMLElement = this.elr.nativeElement.querySelector(`.msg-item[id='${jumpToMessage}']`);
    if (elementMsg) {
      elementMsg.scrollIntoView({
        block: 'center',
        inline: 'start',
        behavior: 'smooth'
      });

      setTimeout(() => {
        elementMsg.scrollIntoView({
          block: 'center',
          inline: 'start',
          behavior: 'auto'
        });
      }, 400);
    }

    console.log('hasJumped: ', !!elementMsg);
    this.updateUIState(this.id, { lastSeenMsgID: this.jumpToMessage, jumpMessageId: null });
    this.hoverMessage = undefined; // reset hover
    this.hoverMessage = this.jumpToMessage;
    if (!elementMsg) {
      this.loadHistoryFirstByMsgId(this.jumpToMessage);
    }
    this.jumpToMessage = null;
  }

  public flowLoadHistory() {
    if (this.jumpToMessage) {
      console.log('load with jumpToMessage');
      this.checkAndNavigateMsg(this.jumpToMessage);
    } else {
      const uiState = this.getUIState(this.id);
      const lastSeenMillis = this.convo instanceof Channel ? this.convo?.lastSeenMillis : null;
      if (uiState?.lastSeenMsgID) {
        console.log('load with lastSeenMsgID');
        console.log('uiState.loadedFirst: ', uiState.loadedFirst);
        if (!uiState.loadedFirst) {
          this.loadHistoryFirstByMsgId(uiState.lastSeenMsgID);
        } else {
          this._useStorePreviewHistory = false;
          this._preventScrollBottom = true;
          this.preInitialDataSource(false, uiState.newMessage?.id);
        }
        this.loadHistoryFirstByMsgId(uiState.lastSeenMsgID);
      } else if (lastSeenMillis) {
        const cacheId = this.id;
        this.messageService
          .getChannelRangeHistory(
            <FilterConvoMessageRangeRequest>{
              convoId: this.convo.id,
              limit: 1,
              fromMillis: lastSeenMillis.toString(),
              toMillis: lastSeenMillis.toString(),
              fromInclusive: true,
              toInclusive: true,
              beforeFromSize: 0,
              afterToSize: 1,
              isAsc: false
            },
            { noLoading: false, isNoStore: true }
          )
          .subscribe(
            history => {
              if (cacheId === this.id) {
                if (history?.messages?.length > 0) {
                  console.log('load with lastSeenMillis + api');
                  this.isViewLastSeen = true;
                  this.newMessageId = history.messages[0].id;
                  this.updateUIState(this.id, {
                    lastSeenMsgID: history.messages[0].id,
                    newMessage: history.messages[0]
                  });
                  this.updateChannel(this.id, { lastSeenMillis: null });
                  this.loadHistoryFirstByMsgId(history.messages[0].id);
                } else {
                  this.loadFirst(uiState);
                }
              }
            },
            err => this.loadFirst(uiState)
          );
      } else {
        this.loadFirst(uiState);
      }
    }
  }

  private loadFirst(uiState: ViewUIStateCommon) {
    if (uiState.newMessage) {
      console.log('load with newMessage');
      console.log('uiState.loadedFirst: ', uiState.loadedFirst);
      if (!uiState.loadedFirst) {
        this.updateUIState(this.id, { lastSeenMsgID: uiState.newMessage.id });
        this.newMessageId = uiState.newMessage.id;
        this.loadHistoryFirstByMsgId(uiState.newMessage.id);
      } else {
        this._useStorePreviewHistory = false;
        this._preventScrollBottom = true;
        this.preInitialDataSource(false, uiState.newMessage?.id);
      }
    } else if (!uiState.loadedFirst) {
      console.log('load with loadedFirst');
      this.loadHistoryFirst();
    } else {
      console.log('load with not api');
      this.preInitialDataSource(false, null);
    }
  }

  private loadHistoryFirst() {
    const convoId = this.id;
    this._useStorePreviewHistory = false;
    this._preventScrollBottom = false;
    const req = <FilterConvoMessageRangeRequest>{
      convoId: convoId,
      limit: DEFAULT_LIMIT,
      from: undefined,
      to: undefined,
      fromInclusive: false,
      toInclusive: false,
      beforeFromSize: 0,
      afterToSize: 0,
      isAsc: false,
      options: {
        withBookmarks: false
      }
    };

    this.getRangeHistories$(req, { noLoading: false, isNoStore: false })
      .pipe(
        tap(() => {
          // reset all state of preview history store
          this.previewHistoryMessageService.cleanupOneConvoMessages(req.convoId);
          this.updateUIState(req.convoId, {
            previewHistory: {
              loadedFirst: false,
              hasMoreBottom: false,
              hasMoreTop: false
            }
          });
        })
      )
      .subscribe(
        history => {
          this.updateUIState(this.id, <ChannelUI>{ loadedFirst: true });
          this.errApiLoadFirst = false;
          if (convoId === this.id) {
            this.addMsgLeaveUserDM();
            this.preInitialDataSource(history.messages.length > 0, null);
          }
        },
        err => {
          this.updateUIState(convoId, <ChannelUI>{ loadedFirst: false });
          // clear live msg from ws
          this.messageService.cleanupOneConvoMessages(convoId);

          if (convoId === this.id) {
            this.errApiLoadFirst = true;
            this.errApiLoadFirst401 = err?.status === 401 && err?.error === 'invalid-token';
            this.preInitialDataSource(false, null);

            if (this.chatService.state.socketStatus !== SocketStatus.opened) {
              this.refetchHistory$ = this.chatService.socketStatus$.pipe(
                map(status => status === SocketStatus.opened),
                filter(x => x),
                debounceTime(500),
                tap(_ => {
                  this.flowLoadHistory();
                })
              );
            }
          }
        }
      );
  }

  private loadHistoryFirstByMsgId(messageId: string) {
    const convoId = this.id;
    this._useStorePreviewHistory = true;

    const hasEntity = this.previewHistoryMessageQuery.hasEntity(messageId);
    console.log('hasEntity: ', hasEntity);
    if (hasEntity) {
      this.errApiLoadFirst = false;
      this._useStorePreviewHistory = true;
      this._preventScrollBottom = true;
      this.preInitialDataSource(false, messageId);
    } else {
      const req = <FilterConvoMessageRangeRequest>{
        convoId: this.convo.id,
        limit: 1,
        from: messageId,
        to: messageId,
        fromInclusive: true,
        toInclusive: true,
        beforeFromSize: 50,
        afterToSize: 50,
        isAsc: true
      };
      this.getRangeHistories$(req, { noLoading: false, isNoStore: true })
        .pipe(
          tap(model => {
            // reset all state of preview history store
            this.previewHistoryMessageService.cleanupOneConvoMessages(req.convoId);
            this.updateUIState(req.convoId, {
              previewHistory: {
                loadedFirst: false,
                hasMoreBottom: false,
                hasMoreTop: false
              }
            });
            this.storePreviewHistory(req, model);
          })
        )
        .subscribe(
          history => {
            this.errApiLoadFirst = false;
            if (convoId === this.id) {
              this._preventScrollBottom = true;
              this.preInitialDataSource(history.messages.length > 0, messageId);
            }
          },
          err => {
            this._useStorePreviewHistory = false;
            // clear live msg from ws
            this.messageService.cleanupOneConvoMessages(convoId);

            if (convoId === this.id) {
              this.errApiLoadFirst = true;
              this.errApiLoadFirst401 = err?.status === 401 && err?.error === 'invalid-token';
              this.preInitialDataSource(false, messageId);

              if (this.chatService.state.socketStatus !== SocketStatus.opened) {
                this.refetchHistory$ = this.chatService.socketStatus$.pipe(
                  map(status => status === SocketStatus.opened),
                  filter(x => x),
                  debounceTime(500),
                  tap(_ => {
                    this.flowLoadHistory();
                  })
                );
              }
            }
          }
        );
    }
  }

  private async loadMoreTop(callback?: Function) {
    const uiState = this.getUIState(this.id);

    const convoId = this.id;
    if (this._useStorePreviewHistory ? uiState.previewHistory?.hasMoreTop : uiState.hasMoreTop) {
      await this.datasource.adapter.relax();
      const { first } = await this.getFirstLastViewport();
      if (first && convoId === this.id) {
        const req = <FilterConvoMessageRangeRequest>{
          convoId: (<InfoMessage>first.data).current.convo,
          limit: DEFAULT_LIMIT,
          from: undefined,
          to: (<InfoMessage>first.data).current.id,
          fromInclusive: false,
          toInclusive: false,
          beforeFromSize: 0,
          afterToSize: 0,
          isAsc: false,
          options: {
            withBookmarks: false
          }
        };

        this.getRangeHistories$(req, { noLoading: false, isNoStore: this._useStorePreviewHistory })
          .pipe(
            tap(model => {
              if (this._useStorePreviewHistory) {
                this.storePreviewHistory(req, model);
              }
            })
          )
          .subscribe(
            history => {
              // same convo
              if (convoId === this.id) {
                if (history.messages.length > 0) {
                  this.updateEofOrBof(false);
                }
                if (callback) {
                  callback();
                }
              }
              setTimeout(() => {
                this._isLoadingMoreTop = false;
              }, 300);
            },
            _ => (this._isLoadingMoreTop = false)
          );
        return;
      }
    }

    this._isLoadingMoreTop = false;
  }

  private async loadMoreBottom(callback?: Function) {
    // save convoid, has update uiState, because of switch convo when API get history not yet.
    const convoId = this.id;
    const uiState = this.getUIState(this.id);

    if (this._useStorePreviewHistory ? uiState.previewHistory?.hasMoreBottom : uiState.hasMoreBottom) {
      const { last } = await this.getFirstLastViewport();
      if (last && convoId === this.id) {
        const req = <FilterConvoMessageRangeRequest>{
          convoId: (<InfoMessage>last.data).current.convo,
          limit: DEFAULT_LIMIT,
          from: (<InfoMessage>last.data).current.id,
          to: undefined,
          fromInclusive: false,
          toInclusive: false,
          beforeFromSize: 0,
          afterToSize: 0,
          isAsc: true,
          options: {
            withBookmarks: false
          }
        };

        this.getRangeHistories$(req, { noLoading: false, isNoStore: this._useStorePreviewHistory })
          .pipe(
            tap(model => {
              if (this._useStorePreviewHistory) {
                this.storePreviewHistory(req, model);
              }
            })
          )
          .subscribe(
            history => {
              // same convo
              if (convoId === this.id) {
                this._preventScrollBottom = true;
                if (history.messages.length > 0) {
                  this.updateEofOrBof(true);
                }
                if (callback) {
                  callback();
                }
              }

              setTimeout(() => {
                this._isLoadingMoreBottom = false;
              });
            },
            _ => (this._isLoadingMoreBottom = false)
          );
        return;
      }
    }
    this._isLoadingMoreBottom = false;
  }

  private storePreviewHistory(req: FilterConvoMessageRangeRequest, model: HistoryMessageRange) {
    const previewHistory = this.getUIState(this.id)?.previewHistory;
    let isMerge = false;
    if (req.afterToSize === 0 && req.beforeFromSize === 0) {
      // case: load first
      if (!req.to && !req.from) {
        if (!req.isAsc) {
          previewHistory.hasMoreTop = model.messages.length !== 0;
        } else {
          previewHistory.hasMoreBottom = model.messages.length !== 0;
        }
      }

      // case: load more top,auto DESC
      if (req.to && !req.from) {
        previewHistory.hasMoreTop = model.messages.length !== 0;
      }

      // case: load more bottom,auto ASC
      if (req.from && !req.to) {
        previewHistory.hasMoreBottom = model.messages.length !== 0;
        if (model.messages.length === 0) {
          isMerge = true;
        }
      }
    } else if (req.from === req.to) {
      // case: jump to message, load 2 directions
      const index = model.messages.findIndex(x => x.id === req.from);
      previewHistory.hasMoreTop = index !== 0;
      previewHistory.hasMoreBottom = index <= model.messages.length - 1;
    }
    this.previewHistoryMessageService.upsertManyMessages(model.messages);
    this.updateUIState(req.convoId, {
      previewHistory: previewHistory
    });

    if (!isMerge && model.messages.length > 0) {
      const last = this.previewHistoryMessageQuery.getAll({
        filterBy: entity => entity.convo === req.convoId && entity.isStore,
        sortBy: 'ts',
        sortByOrder: Order.DESC,
        limitTo: 20
      });
      if (last.length > 0) {
        isMerge = last.some(msg => this.messageQuery.hasEntity(msg.id));
      }
    }

    console.log('🚀 ~ isMerged', isMerge);
    if (isMerge) {
      // merge store
      const all = this.previewHistoryMessageQuery.getAll({
        filterBy: entity => entity.convo === req.convoId
      });
      this._useStorePreviewHistory = false;
      this.isViewLastSeen = false;
      this.messageService.upsertManyMessages(all);
      this.previewHistoryMessageService.removeManyMessage(all.map(x => x.id));
      this.updateUIState(req.convoId, {
        hasMoreBottom: false,
        hasMoreTop: previewHistory.hasMoreTop,
        previewHistory: {
          loadedFirst: false,
          hasMoreBottom: false,
          hasMoreTop: false
        }
      });
    }
  }

  // ============== GET HISTORY ======================
  private async updateEofOrBof(isEof) {
    await this.datasource.adapter.relax();
    if (isEof) {
      await this.datasource.adapter.fix({ maxIndex: +Infinity });
    } else {
      // bof
      await this.datasource.adapter.fix({ minIndex: -Infinity });
    }
    await this.datasource.adapter.relax();
    this.viewport?.nativeElement.dispatchEvent(new Event('scroll'));
  }

  private async resetEofOrBof(isEof) {
    await this.datasource.adapter.relax();
    if (isEof) {
      await this.datasource.adapter.fix({ maxIndex: +Infinity });
    } else {
      // bof
      await this.datasource.adapter.fix({ minIndex: -Infinity });
    }
  }

  private updateEnableScrollBottom(value: number) {
    const maxScrollValue = this.getMaxScrollTopViewportValue();
    const isViewingOlderMessage = value < maxScrollValue - 114; // 28 is minimum of one text message.In editing, 113 is minimum of one text message
    const updatingState = <ViewUIStateCommon>{
      enableScrollBottom: value < this.getMaxScrollTopViewportValue() - 100,
      viewingOlderMessage: isViewingOlderMessage
    };
    if (!isViewingOlderMessage) {
      updatingState.lastSeenMsgID = undefined;
    } else {
      const ui = this.getUIState(this.id);
      if (!ui.lastSeenMsgID) {
        this.updateUIState(this.id, {
          lastSeenMsgID: 'true'
        });
      }
    }
    this.updateUIState(this.id, updatingState);
  }

  private updateConvoViewState(topOffset: number) {
    const convoId = this.id;
    const maxScrollValue = this.getMaxScrollTopViewportValue();
    const isViewingOlderMessage = topOffset < maxScrollValue - 114; // 28 is minimum of one text message.In editing, 113 is minimum of one text message
    const updatingState = <ViewUIStateCommon>{};
    const array: HTMLDivElement[] = Array.from(this.viewport.nativeElement.querySelectorAll('.msg-item'));
    // update seen last message
    if (isViewingOlderMessage) {
      // 64x  is height of conversation-header component
      let indexTopMessage = array.findIndex((msg: HTMLElement) => msg.offsetTop + msg.clientHeight - 64 >= topOffset);
      indexTopMessage = indexTopMessage === undefined ? 0 : indexTopMessage === 0 ? 0 : indexTopMessage - 1;
      const topMsgId = this._useStorePreviewHistory
        ? this.previewHistoryMessageQuery.getEntity(array[indexTopMessage]?.id)
        : this.messageQuery.getEntity(array[indexTopMessage]?.id);

      updatingState.lastSeenMsgID = topMsgId?.clientId;
    } else {
      updatingState.lastSeenMsgID = undefined;
    }

    // update view Date
    updatingState.viewDate = this.findViewDateFirstMessage(array, topOffset);
    this.updateUIState(convoId, updatingState);
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

  private getMaxScrollTopViewportValue() {
    return this.viewport?.nativeElement.scrollHeight - this.viewport?.nativeElement.clientHeight;
  }

  private hasScrollbarViewport() {
    return this.viewport?.nativeElement.scrollHeight > this.viewport?.nativeElement.clientHeight;
  }

  // ================ CONFIG NGX-UI-SCROLL =====================
  private async getData(index: number, count: number): Promise<QueryDataScroll> {
    const filterSelect = {
      limit: count,
      to: null,
      from: null,
      exclude: true
    };
    const { first, last, ids } = await this.getFirstLastViewport();
    const isTop = index + count === first?.$index; // condition load pre
    const isBottom = index - 1 === last?.$index; // condition load more
    if (!isTop && !isBottom) {
      // re-calculator listview.
      const limit = Math.abs(index - this._indexRoot) + 1;
      let msgByIndex, list;
      if (index >= this._indexRoot) {
        list = this._useStorePreviewHistory
          ? this.previewHistoryMessageQuery.getMsgByRoot(this.id, this._root, limit, true)
          : this.messageQuery.getMsgByRoot(this.id, this._root, limit, true);
      } else {
        list = this._useStorePreviewHistory
          ? this.previewHistoryMessageQuery.getMsgByRoot(this.id, this._root, limit, false)
          : this.messageQuery.getMsgByRoot(this.id, this._root, limit, false);
      }
      msgByIndex = list[list.length - 1];

      if (msgByIndex) {
        filterSelect.exclude = false;
        filterSelect.from = msgByIndex.ts;
      } else {
        console.log('---------------------------------ERROR------------------------------');
        // borrow message to render view,
        // TODO: remove fake msg when relax scroll
        const message = new ChatMessage({
          body: new MessageBody({ text: '' }),
          ts: this._root,
          client_ts: this._root,
          user: randomGuid()
        });

        return <QueryDataScroll>{
          query: [new InfoMessage(message, null, true)],
          postion: PositionScroll.none,
          hasMoreTop: 0,
          hasMoreBottom: 0
        };
      }
    } else if (isTop) {
      if ((<InfoMessage>first.data).isFake) {
        filterSelect.exclude = false;
      }
      filterSelect.to = (<InfoMessage>first.data).current.ts;
    } else if (isBottom) {
      if ((<InfoMessage>last.data).isFake) {
        filterSelect.exclude = false;
      }
      filterSelect.from = (<InfoMessage>last.data).current.ts;
    }

    let query: InfoMessage[] | ChatMessage[] = [];
    query = this._useStorePreviewHistory
      ? this.previewHistoryMessageQuery.getAllByConvoNotReconcilation(this.id, filterSelect)
      : this.messageQuery.getAllByConvoNotReconcilation(this.id, filterSelect);
    let hasMoreTop = 0,
      hasMoreBottom = 0;
    let position: PositionScroll;

    if (filterSelect.to) {
      position = PositionScroll.top;
      hasMoreTop = query.length === 0 ? 0 : query.length !== filterSelect.limit ? -1 : 1;

      query = query.reverse();
      query = query.filter(x => !ids.some(id => id === x.id));
      query = query.map((msg, i) => new InfoMessage(msg, i > 0 ? <ChatMessage>query[i - 1] : null));

      // Update pre data for load more top
      let msgPre: ChatMessage[];
      if (query.length > 0) {
        msgPre = this._useStorePreviewHistory
          ? this.previewHistoryMessageQuery.getAllByConvoNotReconcilation(this.id, {
              to: (<InfoMessage>query?.[0])?.current?.ts,
              from: null,
              limit: 1,
              exclude: true
            })
          : this.messageQuery.getAllByConvoNotReconcilation(this.id, {
              to: (<InfoMessage>query?.[0])?.current?.ts,
              from: null,
              limit: 1,
              exclude: true
            });
        if (msgPre?.length === 1) {
          query[0].preMessage = msgPre[0];
        }
      }
    } else {
      position = PositionScroll.bottom;
      hasMoreBottom = query.length === 0 ? 0 : query.length !== filterSelect.limit ? -1 : 1;
      query = query.filter(x => !ids.some(id => id === x.id));
      query = query.map((msg, i) => new InfoMessage(msg, i > 0 ? <ChatMessage>query[i - 1] : null));
      // update pre for first with bottom direction
      if (last && query.length > 0) {
        query[0].preMessage = (<InfoMessage>last.data).current;
      }

      if (!last) {
        // Update pre data for backward
        let msgPre: ChatMessage[];
        if (query.length > 0) {
          msgPre = this._useStorePreviewHistory
            ? this.previewHistoryMessageQuery.getAllByConvoNotReconcilation(this.id, {
                to: (<InfoMessage>query?.[0])?.current?.ts,
                from: null,
                limit: 1,
                exclude: true
              })
            : this.messageQuery.getAllByConvoNotReconcilation(this.id, {
                to: (<InfoMessage>query?.[0])?.current?.ts,
                from: null,
                limit: 1,
                exclude: true
              });
          if (msgPre?.length === 1) {
            query[0].preMessage = msgPre[0];
          }
        }
      }
    }

    return <QueryDataScroll>{
      query: query,
      postion: position,
      hasMoreTop: hasMoreTop,
      hasMoreBottom: hasMoreBottom,
      index: index,
      count: count
    };
  }

  private preInitialDataSource(needToWait: boolean, viewMessageId: string) {
    this.destroyConvo$.next(true);
    //  destroy dom - reload dom

    if (!needToWait) {
      this.initialDataSource(viewMessageId);
    } else {
      const backupId = this.id;
      if (this._useStorePreviewHistory) {
        this.previewHistoryMessageQuery
          .selectAllByConversation(backupId)
          .pipe(
            filter(msgs => msgs?.length > 0),
            take(1),
            takeUntil(this.destroyConvo$)
          )
          .subscribe(_ => {
            if (backupId === this.id) {
              this.initialDataSource(viewMessageId);
            }
          });
      } else {
        this.messageQuery
          .selectAllByConversation(backupId)
          .pipe(
            filter(msgs => msgs?.length > 0),
            take(1),
            takeUntil(this.destroyConvo$)
          )
          .subscribe(_ => {
            if (backupId === this.id) {
              this.initialDataSource(viewMessageId);
            }
          });
      }
    }
  }

  private initialDataSource(viewMessageId: string) {
    if (viewMessageId) {
      const infoMsg = this._useStorePreviewHistory
        ? this.previewHistoryMessageQuery.getEntity(viewMessageId)
        : this.messageQuery.getEntity(viewMessageId);
      if (!!infoMsg && infoMsg?.convo === this.id) {
        this._root = infoMsg.ts;
        this._indexRoot = DATA_SOURCE_START_INDEX;
        this._settingScroll = <Settings>{
          ...this._settingScroll,
          startIndex: DATA_SOURCE_START_INDEX
        };
      } else {
        this.configBottomSetting();
      }
    } else {
      this.configBottomSetting();
    }

    let countTap = 0;
    const config = <IDatasource>{
      get: (index, count) => {
        return from(this.getData(index, count)).pipe(
          tap(data => {
            this._clipScroll$.next(data.postion);

            if (data.hasMoreTop === -1 && data.postion === PositionScroll.top) {
              this.resetEofOrBof(false);
            }

            if (data.hasMoreBottom === -1 && data.postion === PositionScroll.bottom) {
              this.resetEofOrBof(true);
            }

            if (data.hasMoreTop === 0 && data.postion === PositionScroll.top && data.query.length === 0) {
              if (!this._isLoadingMoreTop) {
                this._isLoadingMoreTop = true;
                setTimeout(() => {
                  this.loadMoreTop();
                });
              }
            }

            if (data.hasMoreBottom === 0 && data.postion === PositionScroll.bottom && data.query.length === 0) {
              if (!this._isLoadingMoreBottom) {
                this._isLoadingMoreBottom = true;
                setTimeout(() => {
                  // if (this._useStorePreviewHistory && this.isViewLastSeen && this.convo.isMember) {
                  //   console.log('🚀 ~ this.isViewLastSeen', this.isViewLastSeen);
                  //   const firstVisible = this.datasource.adapter.firstVisible;
                  //   if ((<InfoMessage>firstVisible.data)?.current?.ts) {
                  //     const message = ChatMessage.createSeenMessage(this.convo);
                  //     message.ts = (<InfoMessage>firstVisible.data)?.current?.ts;
                  //     message.client_ts = (<InfoMessage>firstVisible.data)?.current?.ts;
                  //     this.chatService.send(message);
                  //   }
                  // }

                  this.loadMoreBottom(() => {
                    if (this._preventScrollBottom) {
                      this.datasource?.adapter?.isLoading$
                        .pipe(
                          debounceTime(500),
                          takeUntil(this.destroyConvo$),
                          filter(loading => !loading),
                          take(1)
                        )
                        .subscribe(() => {
                          this._preventScrollBottom = false;
                        });
                    }
                  });
                });
              }
            }
          }),
          map(data => data.query),
          tap(_ => {
            countTap++;
            if (countTap === 2) {
              setTimeout(() => {
                // this.intervalLoadMoreWhenNoScrollBar();
              }, 500);
            }

            setTimeout(() => {
              this.handleScrollBottomView();
            }, 0);
          })
        );
      },
      settings: this._settingScroll,
      devSettings: SCROLL_DEV_SETTINGS
    };
    this.resetDatasource(config);
  }

  private resetDatasource(config: IDatasource) {
    this.listenNewMessageFromWS();
    this.trackingReconnect();
    this.trackingJoinConvo();
    this.trackingNewMessage();
    this.trackingActiveApp();

    this.reloadView = true;
    this.cdr.detectChanges();
    this.datasource = new Datasource(config);
    this.handleLoadView(config);
  }

  private handleLoadView(config: IDatasource) {
    this.reloadView = false;
    this.cdr.detectChanges();
    if (!this.viewport) {
      setTimeout(() => {
        this.handleLoadView(config);
      }, 50);
      return;
    }

    this.isShowNewMessage = true;
    this.trackingScrollEvent();
    this.meQuery.me$.pipe(takeUntil(this.destroyConvo$), take(1)).subscribe(me => {
      this.trackingSendSeen(me);
    });
    // this.trackingClipScroll();

    if (this._preventScrollBottom) {
      this.datasource?.adapter?.isLoading$
        .pipe(
          debounceTime(500),
          takeUntil(this.destroyConvo$),
          filter(loading => !loading),
          take(1)
        )
        .subscribe(() => {
          this._preventScrollBottom = false;
        });
    }

    // ** cover convo cannot srcoll to update viewDate because has few message
    this.datasource?.adapter?.isLoading$
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroyConvo$),
        filter(loading => !loading),
        take(1)
      )
      .subscribe(() => {
        this.updateEnableScrollBottom(this.viewport?.nativeElement?.scrollTop);
        this.updateConvoViewState(this.viewport?.nativeElement?.scrollTop);
        this.trackingEditingMessage();
        this.trackingScrollBottom();
      });
  }

  private configBottomSetting() {
    const limit = DATA_INIT_V2 + 1;
    const query = this._useStorePreviewHistory
      ? this.previewHistoryMessageQuery.getMsgByRoot(this.id, this.timeService.nowInMillis(), limit, false).reverse()
      : this.messageQuery.getMsgByRoot(this.id, this.timeService.nowInMillis(), limit, false).reverse();
    this._root = query.length > 0 ? query[0].ts : this.timeService.nowInMillis();
    this._indexRoot = DATA_SOURCE_START_INDEX - DATA_INIT_V2;
    this._settingScroll = <Settings>{
      ...this._settingScroll,
      startIndex: DATA_SOURCE_START_INDEX - DATA_INIT_V2,
      inverse: true
    };
  }

  private async intervalLoadMoreWhenNoScrollBar(count = 1) {
    if (!this.viewport) {
      setTimeout(() => {
        this.intervalLoadMoreWhenNoScrollBar(count);
      }, 500);
      return;
    }

    await this.datasource.adapter.relax();
    if (this.hasScrollbarViewport()) {
      return;
    }

    if (count > 10) {
      return;
    }

    if (!this._isLoadingMoreTop) {
      this._isLoadingMoreTop = true;
      count++;
      this.loadMoreTop(() => {
        setTimeout(() => {
          this.intervalLoadMoreWhenNoScrollBar(count);
        }, 500);
      });
    } else {
      setTimeout(() => {
        this.intervalLoadMoreWhenNoScrollBar(count);
      }, 500);
    }
  }

  // ================ CONFIG NGX-UI-SCROLL =====================

  // ============== TRACKING ============================
  private trackingEditingMessage() {
    this.editingMessageId = null;
    this.selectUiState$('editingMessageId')
      .pipe(takeUntil(this.destroyConvo$))
      .subscribe(id => {
        this.editingMessageId = id;
        // wait dom to render edit-message box
        setTimeout(() => {
          this.handleScrollBottomView();
        });
      });
  }

  private trackingScrollEvent() {
    if (this.viewport) {
      let tapFirst = true;
      const onViewportScroll$ = fromEvent<Event>(this.viewport?.nativeElement, 'scroll').pipe(
        map((event: Event) => event.target['scrollTop'].valueOf()),
        share(),
        tap(value => {
          setTimeout(
            () => {
              const maxScrollValue = this.getMaxScrollTopViewportValue();
              this.isShowNewMessage = value < maxScrollValue - 114;
            },
            tapFirst ? 5000 : 0
          );
          tapFirst = false;
        })
      );

      setTimeout(() => {
        // update lastSeenMessage, viewDate
        onViewportScroll$
          .pipe(
            takeUntil(this.destroyConvo$),
            filter(_ => !!this.viewport),
            debounceTime(100)
          )
          .subscribe(value => {
            this.updateConvoViewState(value);
          });

        // update viewingOlderMessage,enableScrollBottom,check lastSeenMsgID is undefined
        onViewportScroll$
          .pipe(
            takeUntil(this.destroyConvo$),
            filter(_ => !!this.viewport)
          )
          .subscribe(value => {
            this.updateEnableScrollBottom(value);
          });
      }, 500);
    } else {
      setTimeout(() => {
        this.trackingScrollEvent();
      }, 10);
    }
  }

  private trackingSendSeen(me: User) {
    timer(3000, 3000)
      .pipe(
        takeUntil(this.destroyConvo$),
        filter(_ => !!this.viewport && this.windownActiveService.windowActiveStatus)
      )
      .subscribe(_ => {
        const scrollTop = this.viewport?.nativeElement.scrollTop;
        const deta = this.getMaxScrollTopViewportValue() - scrollTop;
        if (deta < 20) {
          if (
            this.convo instanceof ConversationGroup &&
            (this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.Customer)
          ) {
            const txn = this.txnQuery.getEntity(this.convo.conversationGroupId);
            const isMemberTxn = txn?.lastAssignedAgents?.findIndex(x => x === me?.identityUuid) > -1;

            if (this.datasource.adapter.itemsCount > 0 && isMemberTxn && txn?.unreadCount > 0) {
              const message = ChatMessage.createSeenMessage(this.convo);
              this.chatService.send(message);
            }
          } else {
            if (this.convo.isMember && this.convo.unreadCount > 0) {
              const message = ChatMessage.createSeenMessage(this.convo);
              this.chatService.send(message);
            }
          }
        }
      });
  }

  private trackingActiveApp() {
    const id = this.id;
    this.activeIframeService.isMyIframe$
      .pipe(
        filter(actived => !actived),
        takeUntil(this.destroyConvo$)
      )
      .subscribe(_ => {
        console.log('activeIframeService.isMyIframe: ', false);
        this._destroyActiveApp$.next(true);

        // wait active my iframe
        this.activeIframeService.isMyIframe$
          .pipe(
            filter(actived => actived),
            takeUntil(this.destroyConvo$),
            takeUntil(this._destroyActiveApp$),
            take(1)
          )
          .subscribe(async () => {
            console.log('activeIframeService.isMyIframe: ', true);
            if (id === this.id) {
              await this.datasource?.adapter?.relax();
              await this.datasource?.adapter?.check();
            } else {
              this.onConvoChanged();
            }
          });
      });
  }

  private trackingReconnect() {
    const id = this.id;
    this.selectIsDisconnected$()
      .pipe(
        filter(isBroken => isBroken),
        takeUntil(this.destroyConvo$)
      )
      .subscribe(_ => {
        this._destroyReconcileWS$.next(true);
        this.updateUIState(id, <ChannelUI>{
          enableScrollBottom: false,
          loadedFirst: false,
          needReceiveLiveMessage: false,
          hasMoreBottom: false,
          hasMoreTop: false
        });
        this.messageService.cleanupOneConvoMessages(id);

        // wait isBroken = false
        this.selectIsDisconnected$()
          .pipe(
            filter(isBroken => !isBroken),
            takeUntil(this.destroyConvo$),
            takeUntil(this._destroyReconcileWS$),
            take(1)
          )
          .subscribe(() => {
            if (id === this.id) {
              this.updateUIState(id, <ChannelUI>{ needReceiveLiveMessage: true });
              this.flowLoadHistory();
            }
          });
      });
  }

  // support fetch lastest history when you join this channel
  private trackingJoinConvo() {
    const convoId = this.id;
    if (this.convo instanceof Channel && this.convo.type === ChannelType.gc && !this.convo.isMember) {
      this.selectParticipiants$()
        .pipe(
          filter(participants => participants?.some(x => x.userID === this.meQuery.getMe()?.userUuid)), // joined
          takeUntil(this.destroyConvo$),
          take(1)
        )
        .subscribe(_ => {
          if (convoId === this.id) {
            this.messageService.cleanupConvoMessages([convoId]);
            this.resetUIState(this.id);
            this.flowLoadHistory();
          }
        });
    }
  }

  private trackingScrollBottom() {
    this.appQuery.triggerScrollBottomView$.pipe(takeUntil(this.destroyConvo$)).subscribe(value => {
      console.log('value: ', value);
      setTimeout(() => {
        this.handleScrollBottomView();
      });
    });
  }

  private trackingNewMessage() {
    this.selectUiState$('newMessage')
      .pipe(takeUntil(this.destroyConvo$))
      .subscribe(newMessage => {
        this.newMessageId = newMessage?.id;
      });
  }

  // ============== TRACKING ============================
  // ============== HANDLE CLIP SCROLL =========================
  private trackingClipScroll() {
    this._clipScroll$.pipe(debounceTime(2000), takeUntil(this.destroyConvo$)).subscribe(position => {
      if (position === PositionScroll.none) {
        return;
      }
      setTimeout(() => {
        if (this.datasource.adapter.itemsCount > 150) {
          this.handleClip(position);
        }
      });
    });
  }

  private async handleClip(position: PositionScroll) {
    if (position === PositionScroll.top) {
      await this.datasource.adapter.relax();
      await this.datasource.adapter.clip({
        forwardOnly: true
      });
      await this.datasource.adapter.relax();
    } else if (position === PositionScroll.bottom) {
      await this.datasource.adapter.relax();
      await this.datasource.adapter.clip({
        backwardOnly: true
      });
      await this.datasource.adapter.relax();
    }
  }

  // ============== HANDLE CLIP SCROLL =========================
  private getFirstLastViewport() {
    const obj = {
      first: <ItemAdapter>null,
      last: <ItemAdapter>null,
      ids: []
    };
    if (this.datasource) {
      const { adapter } = this.datasource;
      adapter.fix({
        updater: data => {
          if ((<InfoMessage>data.data).current.id) {
            obj.ids.push((data.data as InfoMessage).current.id);
          }
          if (obj.first === null) {
            obj.first = data as ItemAdapter;
          }
          obj.last = data as ItemAdapter;
        }
      });
    }
    return obj;
  }
}
