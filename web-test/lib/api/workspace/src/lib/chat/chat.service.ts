import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CHAT_PUBLIC_V3_PREFIX,
  DomainUtilsService,
  isLocalhost,
  LocalStorageUtil,
  MethodName,
  SendMessageEventData,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { delay, map, mergeMap, retryWhen, scan, share, switchMap, takeWhile, tap } from 'rxjs/operators';
import { ChatMessage } from './chat-message.model';
import { ChatSession, ChatTopic } from './chat-session.model';
import { IdleService } from './idle.service';
import { ReconnectChatStragery, SocketStatus } from './reconnect-stragery.model';

export interface ChatState {
  useWebSoketPortal: boolean; // when true, websocket init on portal-base
  orgUuid: string;
  appId: string;
  session: ChatSession;
  socket: WebSocket;
  socketStatus: SocketStatus;
  reconnectStragery: ReconnectChatStragery;
  isPublic: boolean;
  reqTokenCustomer: ResquestTokenCustomer; // req api for reconnect for liveChat
  tokenLiveChatRecover: string; // put into header to reconnect ws for livechat
}

export interface ResquestTokenCustomer {
  orgUuid: string;
  displayName?: string;
  name?: string;
  email: string;

  // ui
  isInboxFlow: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private _state: ChatState;
  private _message$: Subject<ChatMessage> = new Subject();
  private _socketStatus$: BehaviorSubject<SocketStatus> = new BehaviorSubject<SocketStatus>(SocketStatus.none);
  private _session$: BehaviorSubject<ChatSession> = new BehaviorSubject<ChatSession>(null);
  private _timeLatestMsg: number;
  private _urlCurrent: string;
  private _isV2: boolean;

  constructor(
    private http: HttpClient,
    private domainService: DomainUtilsService,
    private idleService: IdleService,
    private toastService: ToastService
  ) {
    this._state = <ChatState>{
      reconnectStragery: new ReconnectChatStragery()
    };
  }

  get state() {
    return this._state;
  }

  get currentOrgUuid() {
    return this._state ? this._state.orgUuid : null;
  }

  get session$() {
    return this._session$.asObservable();
  }

  get session() {
    return this._state ? this._state.session : null;
  }

  get socketStatus$() {
    return this._socketStatus$.asObservable();
  }

  emitMessage(message: ChatMessage) {
    this._message$.next(message);
  }

  getSubscribeTopic() {
    return this.http.post<{ topics: ChatTopic[] }>(
      `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/user/wss/getSubscription`,
      {}
    );
  }

  subscribeTopic(nameTopics: ChatTopic[]) {
    return this.http.post(`${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/user/wss/subscribe`, {
      topics: nameTopics
    });
  }

  unsubscribeTopic(nameTopics: ChatTopic[]) {
    return this.http.post(`${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/user/wss/unsubscribe`, {
      topics: nameTopics
    });
  }

  initChat(req: { orgUuid: string; appId?: string; bypass?: boolean; isV2?: boolean }) {
    if (req.bypass || this._state.orgUuid !== req.orgUuid) {
      this.normalClose();
      this.updateSocketStatus(SocketStatus.connecting);
      this._state.orgUuid = req.orgUuid;
      this._state.appId = req.appId;
      this._state.reconnectStragery.reset();
      this._isV2 = req.isV2;

      return this.initChatSession().pipe(
        mergeMap(session => {
          return this.init(session);
        })
      );
    }
    return of(null);
  }

  initPublicChat(req: ResquestTokenCustomer, tokenAuthen?: string) {
    this._state.isPublic = true;
    this._state.orgUuid = req.orgUuid;
    this._state.reqTokenCustomer = req;
    this._state.reconnectStragery.reset();
    if (tokenAuthen) {
      this._state.tokenLiveChatRecover = tokenAuthen;
    }

    return (req.isInboxFlow ? this.initPublicsChatSessionV2(req) : this.initPublicsChatSession(req)).pipe(
      mergeMap(session => {
        return this.init(session);
      })
    );
  }

  initLiveChat(session: ChatSession, token: string) {
    this.normalClose();
    if (token) {
      this._state.tokenLiveChatRecover = token;
      return this.init(session);
    }

    this._state.tokenLiveChatRecover = LocalStorageUtil.getItem(`tokenSession_${session.ns}`);
    return this.initPublicChat(this._state.reqTokenCustomer);
  }

  send(message: string | ChatMessage): boolean {
    // console.log(`send message via societ: ${JSON.stringify(data)}`);
    let result: boolean;
    try {
      let msg: string;
      let msgFormated: string;
      if (message instanceof ChatMessage) {
        msgFormated = this.transformFormatMsg(message);
        msg = message.toJSONString();
      } else {
        msg = <string>message;
        msgFormated = this.transformFormatMsg(this.convertStringToJson(message)); // receive msg from iframe // TODO: increase performance-> emit msg before send msg
      }

      if (this.state.useWebSoketPortal) {
        X.fireMessageToParent(MethodName.SendMessage, <SendMessageEventData>{
          message: msg // dont format msg because ws portal will format msg
        });
        result = true;
      } else {
        if (this.isOpening()) {
          const blob = new Blob([msgFormated]);
          if (blob.size > 4 * 1024) {
            this.toastService.error('message-too-large');
          } else {
            this._state.socket.send(msgFormated);
            this.emitMessage(this.convertStringToJson(msg));
          }
          result = true;
        } else {
          console.error({ code: 'noChatSessionOpening', message: 'No chat session opening' });
          // throw { code: 'noChatSessionOpening', message: 'No chat session opening' };
        }
      }
    } catch (e) {
      console.error(e);
    }

    return result;
  }

  onmessage(): Observable<ChatMessage> {
    return this._message$.asObservable().pipe(share());
  }

  clearWs() {
    if (this._state.socket) {
      this._state.socket.close();
      this._state.socket = null;
    }
  }

  normalClose() {
    if (this._state.socket) {
      this._state.socket.close(1000); //the connection successfully completed whatever purpose for which it was created.
    }
  }

  abnormalClose() {
    if (this._state.socket) {
      this._state.socket.close(3000); //the connection successfully completed whatever purpose for which it was created.
    }
  }

  updateSocketStatus(status: SocketStatus) {
    this._state.socketStatus = status;
    this._socketStatus$.next(status);
  }

  updateSessionChat(session: ChatSession) {
    this._state.session = session;
    this._session$.next(session);
  }

  reconnect(req: { forceReset?: boolean; reason: string } = { forceReset: false, reason: '' }) {
    console.log(`======> LOG: ${req.reason} ${req.forceReset ? ', has forceReset' : ''} `);
    if (this._state.socketStatus === SocketStatus.connecting) {
      console.log('already reconnect, waiting for result...');
      return;
    }

    if (req.forceReset) {
      this._state.reconnectStragery.reset();
    }
    console.log(`reconnecting...: ${this._state.reconnectStragery.reconnectTimes}/5`);
    if (this._state.reconnectStragery.canReconnect) {
      this.updateSocketStatus(SocketStatus.connecting);

      setTimeout(
        () => {
          if (this._state.isPublic) {
            this.initPublicsChatSession(this._state.reqTokenCustomer).subscribe(
              session => {
                this.normalClose();
                this.init(session).subscribe();
              },
              _ => {
                this.updateSocketStatus(SocketStatus.closed);
                this.reconnect({ reason: 'call api init public ws fail' });
              }
            );
          } else {
            this.initChatSession().subscribe(
              session => {
                this.normalClose();
                this.init(session).subscribe();
              },
              err => {
                this.updateSocketStatus(SocketStatus.closed);
                this.reconnect({ reason: 'call api init ws fail' });
              }
            );
          }
        },
        req.forceReset ? 0 : this._state.reconnectStragery.waitingTime
      );
      this._state.reconnectStragery.increaseReconnectTime();
    } else {
      console.log('reached reconnect times...');
    }
  }

  private init(session: ChatSession): Observable<any> {
    if (this._state.socket && this._state.socket.readyState === 0) {
      return null;
    }

    let wsAddress = session.addr;
    if (!isLocalhost() && !this._state.isPublic) {
      wsAddress = `${this.domainService.getPortalDomain()}/_${session.chatNode}`;
    }

    const wsUrl = `wss://${wsAddress}/public/user/${session.chatUser}/wss/${session.token}?ns=${session.ns}${
      this._isV2 ? '&version=2' : ''
    }`;
    const socket = new WebSocket(wsUrl);

    return new Observable(ob => {
      let runFirstOpen = false;
      this._urlCurrent = socket?.url;

      socket.onmessage = evt => {
        if (evt?.target?.['url'] !== this._urlCurrent) {
          return;
        }

        if (evt.data) {
          const data = this.convertStringToJson(evt.data);
          if (!!data.ts && !data.st) {
            if (!this._timeLatestMsg) {
              this._timeLatestMsg = data.ts;
            } else {
              if (data.ts <= this._timeLatestMsg) {
                data.ts = this._timeLatestMsg + 1; // add 1 ms
              }
              this._timeLatestMsg = data.ts;
            }
          }

          this.emitMessage(data);
        }
      };

      socket.onopen = evt => {
        if (runFirstOpen) {
          return;
        }
        runFirstOpen = true;

        console.log('onopen', evt?.target?.['url'] === this._urlCurrent);
        // old socket
        if (evt?.target?.['url'] !== this._urlCurrent) {
          return;
        }

        this._state.socket = socket;
        this.updateSessionChat(session);

        if (!this._message$ || this._message$.isStopped) {
          this._message$ = new Subject();
        }

        this._state.reconnectStragery.reset();
        this.updateSocketStatus(SocketStatus.opened);
        this.idleService.start();

        ob.next({ status: 'success' });
        ob.complete();
      };

      let runFirstClose = false;
      socket.onclose = evt => {
        if (runFirstClose) {
          return;
        }
        runFirstClose = true;

        console.log('onclose', evt?.target?.['url'] === this._urlCurrent);
        // old socket
        if (evt?.target?.['url'] !== this._urlCurrent) {
          return;
        }

        console.log(`closed`);
        if (evt?.code === 1006) {
          // manual connect ws
          this.state.reconnectStragery.reconnectTimes = this.state.reconnectStragery.maxRetry;
        }

        this.updateSocketStatus(SocketStatus.closed);
        if (![1000, 1006].includes(evt?.code)) {
          // with 1006 status should check on error
          this.reconnect({ reason: 'evt.code !== 1000' });
        }
        this.idleService.stop();

        ob.next({ status: 'closed' });
        ob.complete();
      };

      let runFirstError = false;
      socket.onerror = evt => {
        if (runFirstError) {
          return;
        }
        runFirstError = true;

        console.log('onError', evt?.target?.['url'] === this._urlCurrent);
        // old socket
        if (evt?.target?.['url'] !== this._urlCurrent) {
          return;
        }

        console.log('on error with: ', evt);
        this.updateSocketStatus(SocketStatus.closed);

        this.idleService.stop();
        this.reconnect({ reason: 'by socket.onError' });

        ob.error();
        ob.complete();
      };
    });
  }

  private isOpening() {
    return this._state.socket && this._state.socket.readyState === WebSocket.OPEN;
  }

  private initChatSession() {
    return this.http.post<ChatSession>(`workspace/private/v1/user/init`, { ts: new Date().valueOf() }).pipe(
      retryWhen(errors => {
        return errors.pipe(
          switchMap(error => {
            if (error.status === 500) {
              return of(error.status);
            }

            return throwError({ message: error.message || 'Init chat session error' });
          }),
          scan(acc => acc + 1, 0),
          takeWhile(acc => acc < 30),
          delay(5000)
        );
      }),
      map(session => new ChatSession(session))
    );
  }

  private initPublicsChatSession(req: ResquestTokenCustomer) {
    return this.http
      .post<{ chatSession: ChatSession; token: string }>(`callcenter/public/v2/customers/chatSession`, req)
      .pipe(
        retryWhen(errors => {
          return errors.pipe(
            switchMap(error => {
              if (error.status === 500) {
                return of(error.status);
              }

              return throwError(error);
            }),
            scan(acc => acc + 1, 0),
            takeWhile(acc => acc < 30),
            delay(5000)
          );
        }),
        tap(session => {
          this._state.tokenLiveChatRecover = session.token;
        }),
        map(session => new ChatSession({ ...session.chatSession, chatUser: session.chatSession.id, ns: req.orgUuid }))
      );
  }

  private initPublicsChatSessionV2(req: ResquestTokenCustomer) {
    return this.http
      .post<{ chatSession: ChatSession; token: string }>(`inbox/public/v2/livechat/_initSession`, req)
      .pipe(
        retryWhen(errors => {
          return errors.pipe(
            switchMap(error => {
              if (error.status === 500) {
                return of(error.status);
              }

              return throwError(error);
            }),
            scan(acc => acc + 1, 0),
            takeWhile(acc => acc < 30),
            delay(5000)
          );
        }),
        tap(session => {
          this._state.tokenLiveChatRecover = session.token;
        }),
        map(session => new ChatSession({ ...session.chatSession, chatUser: session.chatSession.id, ns: req.orgUuid }))
      );
  }

  private transformFormatMsg(msg: ChatMessage) {
    const cloned = cloneDeep(msg) as ChatMessage;
    if (cloned?.metadata) {
      delete cloned?.metadata; // metadata only reveice from BE
    }
    if (cloned?.extraData?.linkedMessages?.snapshots) {
      delete cloned?.extraData?.linkedMessages?.snapshots;
    }

    if (cloned?.body?.data !== null && typeof cloned?.body?.data === 'object') {
      cloned.body.data = JSON.stringify(cloned.body.data);
    }
    return JSON.stringify(cloned);
  }

  private convertStringToJson(message: string): ChatMessage | null {
    try {
      return new ChatMessage(JSON.parse(message));
    } catch (error) {
      return null;
    }
  }
}
