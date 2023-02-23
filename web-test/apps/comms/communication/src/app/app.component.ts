import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery, IdentityProfileService, MeIamService, TeamService } from '@b3networks/api/auth';
import { AgentService, FindAgentsReq, MeQuery as CCMeQuery, MeService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Contact, ContactService } from '@b3networks/api/contact';
import { PersonalSettingsService } from '@b3networks/api/portal';
import {
  ActiveIframeService,
  ChatMessage,
  ChatService,
  ChatSession,
  ChatTopic,
  MeQuery,
  SocketStatus,
  UserService
} from '@b3networks/api/workspace';
import {
  AssignedMode,
  MessageReceiveProcessor,
  RECEIVE_MSG_TYPE_UNIFIED_WORKSPACE,
  RequestFilterTxns,
  RespActivePendingTxn,
  TxnGroupBy,
  TxnMessageReceiveProcessor,
  TxnQuery,
  TxnService,
  TxnStatus
} from '@b3networks/chat/shared/core';
import {
  APP_IDS,
  CallbackEventData,
  DestroySubscriberComponent,
  EventMapName,
  isLocalhost,
  MethodName,
  PORTAL_BASE_HANDLE_WS,
  RegisterWebSocket,
  X
} from '@b3networks/shared/common';
import { combineLatest, filter, forkJoin, Observable, of, take, takeUntil } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

const QUERY_SIZE = 10;

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  socketStatus$: Observable<SocketStatus>;

  constructor(
    private profileService: IdentityProfileService,
    private profileQuery: IdentityProfileQuery,
    private personalSettingsService: PersonalSettingsService,
    private teamService: TeamService,
    private activeIframeService: ActiveIframeService,
    private meIamService: MeIamService,
    private chatService: ChatService,
    private meQuery: MeQuery,
    private userService: UserService,
    private agentService: AgentService,
    private meService: MeService,
    private ccMeQuery: CCMeQuery,
    private contactService: ContactService,
    private messageProcessor: MessageReceiveProcessor,
    private txnMessageReceiveProcessor: TxnMessageReceiveProcessor,
    private txnQuery: TxnQuery,
    private txnService: TxnService
  ) {
    super();
    this.activeIframeService.initListenEvent(APP_IDS.COMMUNICATION_HUB);
    this.registerWebsocketFromPortal();
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      const org = this.profileQuery.currentOrg;
      if (org.isUpperAdmin) {
        this.teamService.getTeamsManagedByAdmin(X.orgUuid, this.profileQuery.identityUuid).subscribe();
      }
    });
    forkJoin([this.personalSettingsService.getPersonalSettings(), this.meIamService.get()]).subscribe();
    this.initChat();
  }

  private initChat() {
    forkJoin([this.meService.get(true).pipe(catchError(() => of(null))), this.userService.getMe()]).subscribe(() => {
      this.chatService
        .onmessage()
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(message => {
          try {
            this.messageProcessor.notNotification = true;
            this.messageProcessor.process(message);
            // TODO: check license
            this.txnMessageReceiveProcessor.process(message);
          } catch (error) {
            console.log(error);
          }
        });

      this.chatService.socketStatus$
        .pipe(
          filter(status => status === SocketStatus.opened),
          takeUntil(this.destroySubscriber$)
        )
        .subscribe(() => {
          // TODO: check license
          this.fetchTxnsV2();
          this.fetchTxns();
        });
    });

    this.agentService.findAgents(new FindAgentsReq()).subscribe();
    this.userService.fetchAllUsers().subscribe();
  }

  private fetchTxnsV2() {
    this.meQuery.me$
      .pipe(
        filter(x => x != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(me => {
        forkJoin([
          this.txnService
            .getTxnByFilter(
              <RequestFilterTxns>{
                status: TxnStatus.active,
                assignedMode: AssignedMode.all,
                groupBy: TxnGroupBy.txn
              },
              new Pageable(1, QUERY_SIZE),
              me.identityUuid
            )
            .pipe(tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts))),
          this.txnService
            .getTxnByFilter(
              <RequestFilterTxns>{
                status: TxnStatus.pending,
                assignedMode: AssignedMode.all,
                groupBy: TxnGroupBy.txn
              },
              new Pageable(1, QUERY_SIZE),
              me.identityUuid
            )
            .pipe(tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts)))
        ])
          .pipe(finalize(() => this.txnService.updateLoadedV2(true)))
          .subscribe();
      });
  }

  private fetchTxns() {
    combineLatest([this.ccMeQuery.me$, this.meQuery.me$])
      .pipe(
        filter(([meCC, me]) => meCC != null && me != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(() => {
        forkJoin([
          this.txnService
            .fetchActiveTxns()
            .pipe(tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts))),
          this.txnService
            .getPending({ page: 1, perPage: QUERY_SIZE })
            .pipe(tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts)))
        ])
          .pipe(finalize(() => this.txnService.updateLoaded(true)))
          .subscribe();
      });
  }

  private registerWebsocketFromPortal() {
    const hasSupportWebsocket = isLocalhost() ? true : sessionStorage.getItem(PORTAL_BASE_HANDLE_WS);
    console.log('hasSupportWebsocket: ', hasSupportWebsocket);

    if (isLocalhost()) {
      this.chatService.initChat({ orgUuid: X.orgUuid }).subscribe();
    }

    if (hasSupportWebsocket) {
      this.chatService.state.useWebSoketPortal = true;
      this.meQuery.me$
        .pipe(
          filter(me => me != null),
          takeUntil(this.destroySubscriber$),
          take(1)
        )
        .subscribe(me => {
          X.fireMessageToParent(MethodName.RegisterWebsocket, <RegisterWebSocket>(<unknown>{
            mt: RECEIVE_MSG_TYPE_UNIFIED_WORKSPACE,
            topics: [ChatTopic.LIVECHAT]
          }));

          let sessionTemp: ChatSession;
          X.registerListener(EventMapName.onSession, session => {
            sessionTemp = session;

            if (session) {
              this.chatService.updateSessionChat(new ChatSession(session));

              X.removeEventListener(EventMapName.onMessage); // remove old registerListener when reconnect ws
              X.registerListener(EventMapName.onMessage, message => {
                this.chatService.emitMessage(new ChatMessage(message));
              });

              let socketStatus: SocketStatus;
              X.removeEventListener(EventMapName.socketStatus); // remove old registerListener when reconnect ws
              X.registerListener(EventMapName.socketStatus, status => {
                socketStatus = status;
                this.chatService.updateSocketStatus(status);
              });

              if (socketStatus !== SocketStatus.opened) {
                X.fireMessageToParent(MethodName.CallbackEventData, <CallbackEventData>{
                  eventName: EventMapName.socketStatus
                });
              }
            }
          });
          if (!sessionTemp) {
            X.fireMessageToParent(MethodName.CallbackEventData, <CallbackEventData>{
              eventName: EventMapName.onSession
            });
          }
        });
    } else {
      this.chatService.state.useWebSoketPortal = false;
    }
  }

  private storeContacts(contacts: Contact[]) {
    if (contacts?.length > 0) {
      this.contactService.updateContacts2Store(contacts);
    }
  }
}
