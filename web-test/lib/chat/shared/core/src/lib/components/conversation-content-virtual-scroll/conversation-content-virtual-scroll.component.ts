import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Channel,
  ChannelHyperspace,
  ChannelType,
  ChannelUI,
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupUI,
  FilterConvoMessageReq,
  GroupType,
  HistoryMessage,
  HistoryMessageQuery,
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
import { DestroySubscriberComponent, randomGuid } from '@b3networks/shared/common';
import { format } from 'date-fns';
import { Datasource, IDatasource } from 'ngx-ui-scroll';
import { BehaviorSubject, from, fromEvent, Observable, Subject, timer } from 'rxjs';
import { debounceTime, filter, map, share, take, takeUntil, tap } from 'rxjs/operators';
import { RegExpPattern } from '../../core/constant/patterns.const';
import { MessageReceiveProcessor } from '../../core/service/message-receive.processor';
import { TxnQuery } from '../../core/service/txn/txn.query';
import { InfoShowMention } from '../../core/state/app-state.model';
import { AppService } from '../../core/state/app.service';
import {
  InteractiveDialogComponent,
  InteractiveDialogData
} from '../dialog/interactive-dialog/interactive-dialog.component';
import { SupportedConvo } from './../../core/adapter/convo-helper.service';
import {
  DATA_INIT,
  DATA_SOURCE_BUFFER_SIZE,
  DATA_SOURCE_START_INDEX,
  DEFAULT_LIMIT,
  HANDLE_SYSTEMS,
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
export abstract class ConversationContentVirtualScrollComponent
  extends DestroySubscriberComponent
  implements AfterViewInit, OnDestroy
{
  readonly SocketStatus = SocketStatus;
  readonly MsgType = MsgType;

  // wait,loading,prevent,block,index
  private _hadEOFDatasource: boolean;
  private _isLoadingMoreTop: boolean;
  private _isLoadingMoreBottom: boolean;
  private _root: number; // time initial load compo or time last seen message
  private _indexRoot: number;

  // handle scroll
  private _clipScroll$ = new BehaviorSubject<PositionScroll>(PositionScroll.none);
  private _destroyConvo$ = new Subject();
  private _destroyReconcileWS$ = new Subject();
  private _destroyComponent$ = new Subject();
  private _preventScrollBottom = false; //  special case for appending data during loading more msg bottom
  private _settingScroll = <Settings>{
    bufferSize: DATA_SOURCE_BUFFER_SIZE,
    startIndex: DATA_SOURCE_START_INDEX - DATA_INIT,
    minIndex: null,
    maxIndex: null,
    inverse: true,
    infinite: true
  };

  reloadView = true;
  editingMessageId: string;
  loadingHistory$: Observable<boolean>;
  enableScrollBottom$: Observable<boolean>;
  errApiLoadFirst: boolean;
  refetchHistory$: Observable<boolean>;

  // ngx-ui-scroll
  datasource: IDatasource;

  @Output() focusQuill = new EventEmitter<boolean>();

  @ViewChild('viewport') viewport: ElementRef | null;

  constructor(
    protected messageQuery: HistoryMessageQuery,
    protected messageService: HistoryMessageService,
    private chatService: ChatService,
    public elr: ElementRef,
    private timeService: TimeService,
    private messageReceiveProcessor: MessageReceiveProcessor,
    protected meQuery: MeQuery,
    private windownActiveService: WindownActiveService,
    private txnQuery: TxnQuery,
    private networkService: NetworkService,
    protected dialog: MatDialog,
    private appService: AppService
  ) {
    super();
  }

  abstract get id();

  abstract get convo(): SupportedConvo;

  abstract getHistories$(id: string, req: FilterConvoMessageReq): Observable<HistoryMessage>;

  abstract addMsgLeaveUserDM();

  abstract selectUiState$<K extends keyof ViewUIStateCommon>(propety?: K): Observable<ViewUIStateCommon[K]>;

  abstract selectParticipiants$(): Observable<IParticipant[]>;

  abstract getUIState(id: string): ViewUIStateCommon;

  abstract selectIsDisconnected$(): Observable<boolean>;

  abstract isDisconnectedStore(): boolean;

  abstract updateUIState(id: string, newState: Partial<any>);

  abstract resetUIState(id: string);

  protected onConvoChanged() {
    this.errApiLoadFirst = false;
    this.loadingHistory$ = this.messageQuery.selectLoading();
    this.enableScrollBottom$ = this.selectUiState$('enableScrollBottom');

    this.flowLoadHistory();
  }

  ngAfterViewInit(): void {
    this.meQuery.me$.pipe(takeUntil(this.destroySubscriber$), take(1)).subscribe(me => {
      this.trackingSendSeen(me);
    });
  }

  override destroy(): void {
    this._destroyReconcileWS$.next(true);
    this._destroyReconcileWS$.unsubscribe();
    this._destroyConvo$.next(true);
    this._destroyConvo$.unsubscribe();
    this._destroyComponent$.next(true);
    this._destroyComponent$.unsubscribe();
  }

  trackByIdx(_: number, message: ChatMessage) {
    return message.clientId;
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

  async scrollToLastestMessage(notRefresh?: boolean) {
    const scrollHeight = this.viewport?.nativeElement?.scrollHeight;
    if (this._hadEOFDatasource && (notRefresh || (this.viewport && scrollHeight < 15000))) {
      await this.datasource.adapter.relax();
      await this.datasource.adapter.fix({ scrollPosition: +Infinity });
    } else {
      this.reloadView = true;
      this.updateUIState(this.id, <ChannelUI>{
        lastSeenMsgID: undefined,
        viewingOlderMessage: false,
        enableScrollBottom: false
      });
      this.preInitialDataSource(false);
    }
  }

  private async handleScrollBottomView() {
    const uiState = this.getUIState(this.id);
    if (!this._preventScrollBottom && !uiState.viewingOlderMessage) {
      await this.datasource.adapter.relax();
      await this.datasource.adapter.fix({ scrollPosition: +Infinity });
    } else {
      this._preventScrollBottom = false;
    }
  }

  // =================== RECEIVE MSG FROM WS =======================
  private listenNewMessageFromWS() {
    // receive message
    this.messageReceiveProcessor
      .onmessage()
      .pipe(
        takeUntil(this._destroyConvo$),
        filter(
          msg =>
            msg.convo === this.id &&
            !!this.datasource &&
            (msg.isStore ||
              (msg.isNoStore && HANDLE_SYSTEMS.indexOf(msg.st) > -1) ||
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
          message: message
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
            this.scrollToLastestMessage(true);
          }
        }
      }
    }
  }

  private async handleSystemMessage(message: ChatMessage) {
    const id = this.id;
    const { adapter } = this.datasource;
    switch (message.st) {
      case SystemType.EDIT:
        await adapter.relax();
        await adapter.fix({
          updater: item => {
            const check = (<InfoMessage>item.data).current.clientId === message.clientId;
            if (check) {
              (<InfoMessage>item.data).current = message;
              // scroll bottom if msg is webhood
              if (message.body.data) {
                const urlMatched = message.body.text?.match(RegExpPattern.URL);
                const uiState = this.getUIState(this.id);
                if (!uiState.viewingOlderMessage && urlMatched) {
                  setTimeout(() => {
                    //  still stay this convo
                    if (id === this.id) {
                      this.datasource.adapter.fix({ scrollPosition: +Infinity });
                    }
                  }, 0);
                }
              }
            }
          }
        });
        break;
      case SystemType.DELETE:
        if (message.id) {
          await adapter.relax();
          await adapter.fix({
            updater: item => {
              if ((<InfoMessage>item.data).current.clientId === message.clientId) {
                (<InfoMessage>item.data).current = message;
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
          await adapter.relax();
          await adapter.check();
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
            let pre: ChatMessage;
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
        }
        break;
    }
  }

  // =================== RECEIVE MSG FROM WS =======================
  // ============== GET HISTORY ======================
  public flowLoadHistory() {
    this.updateUIState(this.id, <ChannelUI>{ needReceiveLiveMessage: true });

    // TODO: scroll to lastmsg
    const loaded = this.getUIState(this.id)?.loaded;
    if (!loaded) {
      this.loadHistoryFirst();
    } else {
      this.preInitialDataSource(false);
    }
  }

  private async loadMoreTop(callback?: Function) {
    const uiState = this.getUIState(this.id);
    const convoId = this.id;
    if (uiState.hasMore) {
      let req = <FilterConvoMessageReq>{
        conversations: [convoId],
        toMillis: uiState.fromMillis,
        limit: DEFAULT_LIMIT
      };

      if (this.convo instanceof ChannelHyperspace) {
        req = <FilterConvoMessageReq>{
          limit: DEFAULT_LIMIT,
          toMillis: uiState.fromMillis,
          hyperchannelId: this.convo.id,
          hyperspaceId: this.convo.hyperspaceId
        };
      }

      this.getHistories$(convoId, req).subscribe(
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
    this._isLoadingMoreTop = false;
  }

  private loadHistoryFirst() {
    const convoId = this.id;
    this.updateUIState(this.id, <ChannelUI>{ loaded: true });
    let req = <FilterConvoMessageReq>{
      conversations: [convoId],
      limit: DEFAULT_LIMIT
    };

    if (this.convo instanceof ChannelHyperspace) {
      req = <FilterConvoMessageReq>{
        limit: DEFAULT_LIMIT,
        hyperchannelId: this.convo.id,
        hyperspaceId: this.convo.hyperspaceId
      };
    }
    this.getHistories$(convoId, req).subscribe(
      history => {
        this.errApiLoadFirst = false;
        if (convoId === this.id) {
          this.addMsgLeaveUserDM();
          this.preInitialDataSource(history.messages.length > 0);
        }
      },
      err => {
        if (convoId === this.id) {
          this.updateUIState(convoId, <ChannelUI>{ loaded: false, needReceiveLiveMessage: false });
          this.errApiLoadFirst = true;
          this.preInitialDataSource(false);

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

  private async loadMoreBottom(callback?: Function) {
    // save convoid, has update uiState, because of switch convo when API get history not yet.
    const convoId = this.id;
    const uiState = this.getUIState(this.id);
    if (uiState.hasMoreBottom) {
      let req = <FilterConvoMessageReq>{
        conversations: [convoId],
        fromMillis: uiState.toMillis,
        limit: DEFAULT_LIMIT
      };

      if (this.convo instanceof ChannelHyperspace) {
        req = <FilterConvoMessageReq>{
          fromMillis: uiState.toMillis,
          limit: DEFAULT_LIMIT,
          hyperchannelId: this.convo.id,
          hyperspaceId: this.convo.hyperspaceId
        };
      }

      this.getHistories$(convoId, req).subscribe(
        history => {
          // same convo
          if (convoId === this.id) {
            if (history.messages.length > 0) {
              this._preventScrollBottom = true;
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
    this._isLoadingMoreBottom = false;
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

  private updateConvoViewState(topOffset: number) {
    const convoId = this.id;
    const isViewingOlderMessage = this.isViewingOlderMessage(topOffset);
    const updatingState = <ConversationGroupUI>{};
    const array: HTMLDivElement[] = Array.from(this.viewport.nativeElement.querySelectorAll('.msg-item'));
    // update seen last message
    if (isViewingOlderMessage) {
      // 64x  is height of conversation-header component
      let indexTopMessage = array.findIndex((msg: HTMLElement) => msg.offsetTop + msg.clientHeight - 64 >= topOffset);
      indexTopMessage = indexTopMessage === undefined ? 0 : indexTopMessage === 0 ? 0 : indexTopMessage - 1;
      const topMsgId = this.messageQuery.getEntity(array[indexTopMessage]?.id);

      updatingState.lastSeenMsgID = topMsgId?.clientId;
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

  private isViewingOlderMessage(scrollTop: number) {
    const maxScrollValue = this.getMaxScrollTopViewportValue();
    // true => scroll to the last potision , false => sroll bottom
    return scrollTop < maxScrollValue - 114; // 28 is minimum of one text message.In editing, 113 is minimum of one text message
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
    const isBackward = index + count === first?.$index; // condition load pre
    const isForward = index - 1 === last?.$index; // condition load more
    if (!isBackward && !isForward) {
      // re-calculator listview.
      const limit = Math.abs(index - this._indexRoot) + 1;
      let msgByIndex, list;
      if (index >= this._indexRoot) {
        list = this.messageQuery.getMsgByRoot(this.id, this._root, limit, true);
      } else {
        list = this.messageQuery.getMsgByRoot(this.id, this._root, limit, false);
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
    } else if (isBackward) {
      if ((<InfoMessage>first.data).isFake) {
        filterSelect.exclude = false;
      }
      filterSelect.to = (<InfoMessage>first.data).current.ts;
    } else if (isForward) {
      if ((<InfoMessage>last.data).isFake) {
        filterSelect.exclude = false;
      }
      filterSelect.from = (<InfoMessage>last.data).current.ts;
    }

    let query: InfoMessage[] | ChatMessage[] = [];
    query = this.messageQuery.getAllByConvoNotReconcilation(this.id, filterSelect);
    let hasMoreTop = 0,
      hasMoreBottom = 0;
    let position: PositionScroll;

    if (filterSelect.to) {
      position = PositionScroll.top;
      hasMoreTop = query.length === 0 ? 0 : query.length !== filterSelect.limit ? -1 : 1;
      // Update pre data for backward
      if (
        first &&
        query.length > 0 &&
        (!this.hasSameDate((<InfoMessage>first.data).current.ts, (<ChatMessage>query[0]).ts) || // diff date
          (<InfoMessage>first.data).current.user === (<ChatMessage>query[0]).user) // same user
      ) {
        const { adapter } = this.datasource;
        adapter.fix({
          updater: ({ $index, data }) => {
            if ($index === first.$index) {
              (data as InfoMessage).preMessage = <ChatMessage>query[0];
            }
          }
        });
      }

      query = query.reverse();
      query = query.filter(x => !ids.some(id => id === x.id));
      query = query.map((msg, i) => new InfoMessage(msg, i > 0 ? <ChatMessage>query[i - 1] : null));
    } else {
      position = PositionScroll.bottom;
      hasMoreBottom = query.length === 0 ? 0 : query.length !== filterSelect.limit ? -1 : 1;
      query = query.filter(x => !ids.some(id => id === x.id));
      query = query.map((msg, i) => new InfoMessage(msg, i > 0 ? <ChatMessage>query[i - 1] : null));
      // update pre for forward
      if (last) {
        query[0].preMessage = (<InfoMessage>last.data).current;
      }
    }

    return <QueryDataScroll>{
      query: query,
      postion: position,
      hasMoreTop: hasMoreTop,
      hasMoreBottom: hasMoreBottom
    };
  }

  private preInitialDataSource(needToWait: boolean) {
    this._destroyConvo$.next(true);
    //  destroy dom - reload dom

    if (!needToWait) {
      this.initialDataSource();
    } else {
      const backupId = this.id;
      this.messageQuery
        .selectAllByConversation(backupId)
        .pipe(
          filter(msgs => msgs?.length > 0),
          take(1),
          takeUntil(this._destroyConvo$)
        )
        .subscribe(_ => {
          if (backupId === this.id) {
            this.initialDataSource();
          }
        });
    }
  }

  private hasSameDate(time1: number, time2: number) {
    const date1 = format(new Date(time1), 'dd/MM/yyyy');
    const date2 = format(new Date(time2), 'dd/MM/yyyy');
    return date1 === date2;
  }

  private initialDataSource() {
    const uiState = this.getUIState(this.id);
    if (uiState.lastSeenMsgID) {
      this._hadEOFDatasource = false;
      const infoMsg = this.messageQuery.getEntity(uiState.lastSeenMsgID);
      if (!!infoMsg && infoMsg?.convo === this.id) {
        this._root = infoMsg.ts;
        this._indexRoot = DATA_SOURCE_START_INDEX;
        this._settingScroll = <Settings>{
          ...this._settingScroll,
          startIndex: DATA_SOURCE_START_INDEX,
          inverse: false
        };
      } else {
        this.configBottomSetting();
      }
    } else {
      this.configBottomSetting();
    }

    let isQueryFirst = true;
    const config = <IDatasource>{
      get: (index, count) => {
        return from(this.getData(index, count)).pipe(
          tap(data => {
            this._clipScroll$.next(data.postion);

            if (data.hasMoreTop === -1 && data.postion === PositionScroll.top) {
              this.resetEofOrBof(false);
            }

            // if (data.hasMoreBottom === -1 && data.postion === PositionScroll.forward) {
            //   this.resetEofOrBof(true);
            // }

            if (data.hasMoreTop === 0 && data.postion === PositionScroll.top && data.query.length === 0) {
              if (!this._isLoadingMoreTop) {
                this._isLoadingMoreTop = true;
                setTimeout(() => {
                  this.loadMoreTop();
                });
              }
            }

            // if (data.hasMoreBottom === 0 && data.postion === PositionScroll.forward && data.query.length === 0) {
            //   if (!this._isLoadingMoreBottom) {
            //     this._isLoadingMoreBottom = true;
            //     setTimeout(() => {
            //       this.loadMoreBottom();
            //     });
            //   }
            // }
          }),
          map(data => data.query),
          tap(_ => {
            if (isQueryFirst) {
              isQueryFirst = false;
              this.intervalLoadMoreWhenNoScrollBar();
            }

            if (this._hadEOFDatasource) {
              setTimeout(() => {
                this.handleScrollBottomView();
              }, 0);
            }
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

    this._hadEOFDatasource = false;
    this.reloadView = true;

    this.datasource = new Datasource(config);
    // check: load lastest message in store -> eof list view
    this.datasource.adapter.eof$
      .pipe(
        takeUntil(this._destroyConvo$),
        filter(eof => !!eof),
        take(1)
      )
      .subscribe(() => (this._hadEOFDatasource = true));

    setTimeout(() => {
      this.handleLoadView(config);
    });
  }

  private handleLoadView(config: IDatasource) {
    this.reloadView = false;
    if (!this.viewport) {
      setTimeout(() => {
        this.handleLoadView(config);
      }, 50);
      return;
    }

    this.trackingScrollEvent();
    this.trackingClipScroll();
    // ** cover convo cannot srcoll to update viewDate because has few message
    setTimeout(() => {
      this.saveViewDateFirstView();
      this.trackingEditingMessage();
    }, 300);
  }

  private configBottomSetting() {
    const limit = DATA_INIT + 1;
    const query = this.messageQuery.getMsgByRoot(this.id, this.timeService.nowInMillis(), limit, false).reverse();
    this._root = query.length > 0 ? query[0].ts : this.timeService.nowInMillis();
    this._indexRoot = DATA_SOURCE_START_INDEX - DATA_INIT;
    this._settingScroll = <Settings>{
      ...this._settingScroll,
      startIndex: DATA_SOURCE_START_INDEX - DATA_INIT,
      inverse: true
    };
  }

  private async intervalLoadMoreWhenNoScrollBar() {
    if (!this.viewport) {
      setTimeout(() => {
        this.intervalLoadMoreWhenNoScrollBar();
      }, 500);
      return;
    }

    await this.datasource.adapter.relax();
    if (this.hasScrollbarViewport()) {
      return;
    }

    if (!this._isLoadingMoreTop) {
      this._isLoadingMoreTop = true;
      this.loadMoreTop(() => {
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

  // ================ CONFIG NGX-UI-SCROLL =====================
  private saveViewDateFirstView() {
    if (this.viewport) {
      const array: HTMLDivElement[] = Array.from(this.viewport?.nativeElement.querySelectorAll('.msg-item'));
      const updatingState = <ConversationGroupUI>{
        viewDate: this.findViewDateFirstMessage(array, this.getMaxScrollTopViewportValue())
      };
      this.updateUIState(this.id, updatingState);
    } else {
      setTimeout(() => {
        this.saveViewDateFirstView();
      }, 500);
    }
  }

  // ============== TRACKING ============================
  private trackingEditingMessage() {
    this.editingMessageId = null;
    this.selectUiState$('editingMessageId')
      .pipe(takeUntil(this._destroyConvo$))
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
      const onViewportScroll$ = fromEvent(this.viewport?.nativeElement, 'scroll').pipe(
        map(event => (event as Event).target['scrollTop'].valueOf()),
        share()
      );

      setTimeout(() => {
        // update lastSeenMessage & viewDate
        onViewportScroll$
          .pipe(
            takeUntil(this._destroyConvo$),
            filter(_ => !!this.viewport),
            debounceTime(200)
          )
          .subscribe(value => {
            this.updateConvoViewState(value);
          });

        // update viewingOlderMessage,enableScrollBottom,check lastSeenMsgID is undefined
        onViewportScroll$
          .pipe(
            takeUntil(this._destroyConvo$),
            filter(_ => !!this.viewport)
          )
          .subscribe(value => {
            const isViewingOlderMessage = this.isViewingOlderMessage(value);
            const enableScrollBottom =
              !this._hadEOFDatasource || (this._hadEOFDatasource && value < this.getMaxScrollTopViewportValue() - 100);
            const uiState = <ConversationGroupUI>{
              viewingOlderMessage: isViewingOlderMessage,
              enableScrollBottom: enableScrollBottom
            };
            if (!isViewingOlderMessage) {
              uiState.lastSeenMsgID = undefined;
            }
            this.updateUIState(this.id, uiState);
          });
      }, 500);

      // load to prepend or append
      // combineLatest([onViewportScroll$, this.datasource.adapter.isLoading$.pipe(filter(isLoading => !isLoading))])
      //   .pipe(
      //     finalize(() => (this._isLoadingMorePrepend = false)),
      //     debounceTime(200),
      //     takeUntil(this._destroyConvo$)
      //   )
      //   .subscribe(([value, _]) => {
      //     if (!this._isLoadingMorePrepend && value === 0) {
      //       // prepend
      //       this._isLoadingMorePrepend = true;
      //       this.loadMoreTop();
      //     } else if (!this._isLoadingMoreAppend && !this.isViewingOlderMessage(value)) {
      //       // append
      //       // this._isLoadingMoreAppend = true;
      //       // this.loadMoreAppend();
      //     }
      //   });
    } else {
      setTimeout(() => {
        this.trackingScrollEvent();
      }, 10);
    }
  }

  private trackingSendSeen(me: User) {
    timer(0, 3000)
      .pipe(
        takeUntil(this._destroyComponent$),
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

  private trackingReconnect() {
    const id = this.id;
    this.selectIsDisconnected$()
      .pipe(
        filter(isBroken => isBroken),
        takeUntil(this._destroyConvo$)
      )
      .subscribe(_ => {
        this._destroyReconcileWS$.next(true);
        this.messageService.cleanupOneConvoMessages(id);
        this.updateUIState(id, <ChannelUI>{
          loaded: false,
          viewingOlderMessage: false,
          lastSeenMsgID: undefined,
          enableScrollBottom: false,
          toMillis: undefined,
          fromMillis: undefined
        });

        // wait isBroken = false
        this.selectIsDisconnected$()
          .pipe(
            filter(isBroken => !isBroken),
            takeUntil(this._destroyConvo$),
            takeUntil(this._destroyReconcileWS$),
            take(1)
          )
          .subscribe(() => {
            if (id === this.id) {
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
          takeUntil(this._destroyConvo$),
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

  // ============== TRACKING ============================
  // ============== HANDLE CLIP SCROLL =========================
  private trackingClipScroll() {
    this._clipScroll$.pipe(debounceTime(2000), takeUntil(this._destroyConvo$)).subscribe(position => {
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
