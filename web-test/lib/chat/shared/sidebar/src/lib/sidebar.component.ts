import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { IdentityProfile, IdentityProfileQuery, MemberRole } from '@b3networks/api/auth';
import { ExtType } from '@b3networks/api/bizphone';
import { ChatTypeTxn, Me, MeQuery as CCMeQuery, TxnType } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Contact, ContactQuery, ContactService, ContactType } from '@b3networks/api/contact';
import { GetReportV4Payload, Period, ReportV4Code, TxnChatLog, TxnStatusChat, V4Service } from '@b3networks/api/data';
import { MeQuery as MeLicenseQuery } from '@b3networks/api/license';
import {
  ActionCase,
  CaseMessageData,
  ChannelHyperspaceQuery,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  EmailMessageGeneral,
  GroupType,
  Hyperspace,
  MeQuery,
  MsgType,
  SocketStatus,
  Status,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  AssignedMode,
  ConvoHelperService,
  MessageConstants,
  RequestFilterTxns,
  RespActivePendingTxn,
  SidebarTabs,
  Txn,
  TxnGroupBy,
  TxnQuery,
  TxnService,
  TxnStatus,
  UnifiedChannel
} from '@b3networks/chat/shared/core';
import { ComposeEmailDialogData, ComposeEmailMessageComponent, SearchComponent } from '@b3networks/chat/shared/email';
import {
  CapitalizeCasePipe,
  DestroySubscriberComponent,
  MethodName,
  TimeRangeHelper,
  TimeRangeKey,
  UpdateNoticationData,
  X
} from '@b3networks/shared/common';
import { BrowserNotificationService, NotificationRouterLink } from '@b3networks/shared/notification';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { debounceTime, filter, finalize, map, skip, switchMap, take, takeUntil, tap } from 'rxjs/operators';

export enum Session {
  assign2Me = 'assign2Me',
  assign2Other = 'assign2Other',
  unasssign = 'unasssign'
}

export enum TeamInboxFiter {
  Assigned = 'Assigned',
  Open = 'Open',
  Closed = 'Closed'
}

const PENDING_SIZE = 20;

@Component({
  selector: 'b3n-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() isDone: boolean; // fetch api success

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

  // parent
  isShowAllChannel: boolean;
  isShowClosedTxn = false;
  selectedFiter: TeamInboxFiter = TeamInboxFiter.Assigned;

  isSupervisor: boolean;
  isNormalExt: boolean;
  hasExtCallcenter: boolean;

  isLoadingActiveTxn: boolean;
  isLoadingMorePending: boolean;
  timeZone: string;
  contextMenuPosition = { x: '0px', y: '0px' };
  fixedResizerMaxHeight = 0;

  // new
  isAgent$: Observable<boolean>;
  me: User;
  inboxV2$: Observable<TxnCustom[]>;
  inbox$: Observable<TxnCustom[]>;
  endChat$: Observable<TxnCustom[]>;
  endChatOrg$: Observable<TxnCustom[]>;
  unassigned$: Observable<TxnCustom[]>;
  assignedToOther$: Observable<TxnCustom[]>;

  // async
  onmessage$: Observable<ChatMessage>;
  me$: Observable<Me>;
  profile$: Observable<IdentityProfile>;
  channelCs$: Observable<UnifiedChannel[]>;
  channelDMs$: Observable<UnifiedChannel[]>;
  channelPersonals$: Observable<UnifiedChannel[]>;
  isOwner$: Observable<boolean>;
  sidebarTabActive$: Observable<SidebarTabs>;
  selectUnreadBadge$: Observable<boolean>;
  selectUnreadCountInbox$: Observable<boolean>;
  hasTeamChatLicense$: Observable<boolean>;

  // hasMore
  unassignedPage = 1;

  private _OSName: OS;
  private _totalUnread: number;
  private _listNotifyAssign2Me: string[] = []; // txnUuid

  readonly GroupType = GroupType;
  readonly Session = Session;
  readonly ChannelType = ChannelType;
  readonly SidebarTabs = SidebarTabs;
  readonly TeamInboxFiter = TeamInboxFiter;

  @HostListener('window:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.dialog.openDialogs.length === 0) {
      if (this._OSName === OS.MacOS && event.metaKey && event.key.toLowerCase() === 'k') {
        this.openMenuTeamChat(event);
      } else if (this._OSName !== OS.MacOS && event.ctrlKey && event.key.toLowerCase() === 'k') {
        this.openMenuTeamChat(event);
      }
    }
  }

  constructor(
    private router: Router,
    private elr: ElementRef,
    private dialog: MatDialog,
    private ccMeQuery: CCMeQuery,
    private meQuery: MeQuery,
    private identityProfileQuery: IdentityProfileQuery,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private chatService: ChatService,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private userQuery: UserQuery,
    private txnService: TxnService,
    private txnQuery: TxnQuery,
    private contactService: ContactService,
    private contactQuery: ContactQuery,
    private v4Service: V4Service,
    private capitalizeCasePipe: CapitalizeCasePipe,
    private browserNotification: BrowserNotificationService,
    private appQuery: AppQuery,
    private appService: AppService,
    private convoHelperService: ConvoHelperService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private meLicenseQuery: MeLicenseQuery
  ) {
    super();
    this.detectOS();
  }

  ngOnInit(): void {
    this.sidebarTabActive$ = this.appQuery.sidebarTabActive$;
    this.isOwner$ = this.identityProfileQuery.roleCurrentOrg$.pipe(map(role => role === MemberRole.OWNER));

    this.me$ = this.ccMeQuery.me$.pipe(
      filter(x => x != null),
      tap(meCC => {
        this.isSupervisor = meCC?.isSupervisor;
      })
    );

    this.profile$ = this.identityProfileQuery.profile$.pipe(filter(profile => profile !== null));
    this.hasTeamChatLicense$ = this.meLicenseQuery.hasTeamChatLicense$;

    this.isAgent$ = this.meQuery.me$.pipe(
      switchMap(me => this.userQuery.selectEntity(me?.uuid)),
      map(m => m?.isAgent)
    );

    // set timeZone
    this.identityProfileQuery
      .selectProfileOrg(X.orgUuid)
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$),
        take(1)
      )
      .subscribe(org => {
        this.timeZone = org?.utcOffset;
      });

    this.initLivechatV2();
    this.initLivechatV1();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDone'] && this.isDone) {
      // fetchAllUsers api completed
      this.userQuery
        .selectAll({
          filterBy: entity => entity.isActive
        })
        .pipe(
          map(x => x.map(u => u.userUuid)),
          takeUntil(this.destroySubscriber$)
        )
        .subscribe(userUuids => {
          this.selectUnreadBadge$ = this.channelQuery.selectUnreadBadge(userUuids);
        });

      this.subscribeActiveChannel();
    }
  }

  trackByHyperspace(index, item: Hyperspace) {
    return item.id;
  }

  onManagementHyperspace() {
    this.router.navigate(['hyperspace', 'management']);
  }

  filterChannel() {
    this.isShowAllChannel = !this.isShowAllChannel;
    this.fetchConvos();
  }

  showMenuTeamInbox(event: MouseEvent) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.openMenu();
  }

  changeSidebarTab(tab: SidebarTabs) {
    this.appService.update({ sidebarTabActive: tab });
  }

  openSearch() {
    this.dialog
      .open(SearchComponent, {
        width: '80vw',
        height: '80vh',
        panelClass: 'position-relative',
        position: {
          top: '40px'
        }
      })
      .afterClosed()
      .subscribe();
  }

  composeEmail() {
    this.dialog.open(ComposeEmailMessageComponent, {
      width: '1000px',
      data: <ComposeEmailDialogData>{
        msg: new EmailMessageGeneral()
      },
      disableClose: true,
      panelClass: 'position-relative'
    });
  }

  loadmoreEndtxn(isByOrg = false) {
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(TimeRangeKey.last90days, this.timeZone);
    const req = <GetReportV4Payload>{
      startTime: timeRange.startDate,
      endTime: timeRange.endDate,
      orgUuid: X.orgUuid,
      filter: {
        status: 'end' // "ongoing"
      }
    };

    if (!isByOrg) {
      req.filter.agentUuids = this.me.identityUuid;
    }

    const endTxnsUWState = !isByOrg ? this.appQuery.endTxnsUWState() : this.appQuery.endTxnsUWOrgState();
    this.fetchEndTxns(req, new Pageable(endTxnsUWState.page + 1, endTxnsUWState.perPage), isByOrg);
  }

  private storeContacts(contacts: Contact[]) {
    if (contacts?.length > 0) {
      this.contactService.updateContacts2Store(contacts);
    }
  }

  private fetchEndTxns(req, pageable: Pageable, isByOrg: boolean) {
    this.v4Service
      .getReportData<TxnChatLog>(Period.dump, ReportV4Code.chatUnifiedHistory, req, pageable, false)
      .pipe(
        map(resp => resp?.rows || []),
        tap(data => {
          // store contacts
          const contacs = data
            .filter(x => x?.customer?.customerUuid)
            .map(x => {
              let contact = this.contactQuery.getEntity(x.customer.customerUuid);
              if (!contact || contact?.isTemporary) {
                contact = <Contact>{
                  uuid: x.customer?.customerUuid,
                  chatCustomerId: x?.customer?.chatCustomerId,
                  displayName: x?.customer?.displayName,
                  isTemporary: true
                };
              }
              return contact;
            });

          this.contactService.updateContacts2Store(contacs);

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

          if (!isByOrg) {
            this.appService.update({
              endTxnsUWState: {
                hasMore: txns.length === pageable.perPage,
                page: pageable.page,
                perPage: pageable.perPage
              }
            });
          } else {
            this.appService.update({
              endTxnsUWOrgState: {
                hasMore: txns.length === pageable.perPage,
                page: pageable.page,
                perPage: pageable.perPage
              }
            });
          }
        })
      )
      .subscribe();
  }

  private fetchTxns() {
    this.isLoadingActiveTxn = true;
    if (this.isSupervisor) {
      forkJoin([
        this.txnService.fetchActiveTxns().pipe(tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts))),
        this.txnService
          .getPending({ page: this.unassignedPage, perPage: PENDING_SIZE })
          .pipe(tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts)))
      ])
        .pipe(
          finalize(() => {
            this.txnService.updateLoaded(true);
            this.isLoadingActiveTxn = false;
          })
        )
        .subscribe();
    } else {
      this.txnService
        .fetchActiveTxns()
        .pipe(
          finalize(() => {
            this.txnService.updateLoaded(true);
            this.isLoadingActiveTxn = false;
          }),
          tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts))
        )
        .subscribe();
    }
  }
  private fetchTxnsV2() {
    this.isLoadingActiveTxn = true;

    this.txnService
      .getTxnByFilter(
        <RequestFilterTxns>{
          status: TxnStatus.active,
          assignedMode: AssignedMode.me,
          groupBy: TxnGroupBy.customer
        },
        new Pageable(1, 10),
        this.me.identityUuid
      )
      .pipe(
        tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts)),
        finalize(() => {
          this.txnService.updateLoadedV2(true);
          this.isLoadingActiveTxn = false;
        })
      )
      .subscribe();
  }

  private transferTxn2Store(data: CaseMessageData, client_ts: number): Txn {
    const txn = <Txn>{
      txnUuid: data.txnUuid,
      txnType: data.txnType,
      customerUuid: data.customerUuid,
      createdAt: data?.startedAtByUnix || client_ts,
      lastAssignedAgents: data?.members,
      channel: data?.channel || ChatTypeTxn.whatsapp,
      unreadCount: 1
    };
    if (data.members) {
      txn.lastAssignedAgents = data.members;
    }
    if (data.caseCode) {
      txn.caseCode = data.caseCode;
    }
    if (data.metadata) {
      txn.metadata = data.metadata;
    }
    return txn;
  }

  private processV2(message: ChatMessage) {
    const data: CaseMessageData = message.body.data;
    if (data.action === ActionCase.notifyAgent) {
      return;
    }

    // add customer2store with isTemporary
    const contact = this.contactQuery.getEntity(data?.customerUuid);
    if (!contact || contact?.isTemporary) {
      const mapingContact = <Contact>{
        uuid: data.customerUuid,
        displayName: data.customerName,
        chatCustomerId: data.chatCustomerId,
        isTemporary: true
      };

      // ActionCase.txnTag2Case + endChat. BE not support
      if ([ActionCase.txnTag2Customer, ActionCase.assignTxn].indexOf(data.action) > -1) {
        mapingContact.contactLists = data.contactListType;
        mapingContact.type = data.customerType;
      }

      this.contactService.updateContacts2Store([mapingContact]);
    }

    if (data.action === ActionCase.txnTag2Customer) {
      const txn = this.transferTxn2Store(data, message.client_ts);
      this.txnService.updateTxn2Store(data.txnUuid, txn);

      // notify
      if (![TxnType.outgoing, TxnType.incoming2extension].includes(data.txnType)) {
        let needNotify: boolean, type: string, title: string;
        const routerLink = <NotificationRouterLink>{
          commands: ['contacts', data?.customerUuid, 'txns', 'active']
        };
        if (this.isSupervisor) {
          // for all
          type = this.getTypeTxn(data);
          title = MessageConstants.NOTIFY_NEW_TXN_IN_CONTACT(data?.customerName, type);
          needNotify = true;
        } else {
          if (data?.members?.indexOf(this.me.identityUuid) > -1) {
            // for me
            type = this.getTypeTxn(data);
            title = MessageConstants.NOTIFY_NEW_TXN_IN_CONTACT(data?.customerName, type);
            needNotify = true;
          }
        }

        if (needNotify) {
          this.browserNotification
            .sendNotify(
              title,
              <NotificationOptions>{
                icon: `https://ui.b3networks.com/external/icon/unified_workspace_128.png`
              }, // hardcoding for whatsapp first
              routerLink
            )
            .subscribe();
        }
      }
    } else if (data.action === ActionCase.assignTxn) {
      if (!this.isSupervisor && this._listNotifyAssign2Me.indexOf(data.txnUuid) === -1) {
        if (
          ![TxnType.outgoing, TxnType.incoming2extension].includes(data.txnType) &&
          data?.members?.indexOf(this.me.identityUuid) > -1
        ) {
          // for me
          this._listNotifyAssign2Me.push(data.txnUuid);
          const type = this.getTypeTxn(data);
          const title = MessageConstants.NOTIFY_NEW_TXN_IN_CONTACT(data?.customerName, type);
          const routerLink = <NotificationRouterLink>{
            commands: ['contacts', data?.customerUuid, 'txns', 'active']
          };
          this.browserNotification
            .sendNotify(
              title,
              <NotificationOptions>{
                icon: `https://ui.b3networks.com/external/icon/unified_workspace_128.png`
              }, // hardcoding for whatsapp first
              routerLink
            )
            .subscribe();
        }
      }
      // add or update txn
      const txn = this.transferTxn2Store(data, message.client_ts);
      this.txnService.updateTxn2Store(data.txnUuid, txn);
    } else if (data.action === ActionCase.endChat) {
      const detail = this.txnQuery.getEntity(data.txnUuid);
      if (detail) {
        const txn = <Txn>{
          ...detail,
          closed: true
        };

        this.txnService.updateTxns2Store([txn]);
      }

      // archived conversationGroup
      const convo = this.convoGroupQuery.getEntity(data.txnUuid);
      if (convo) {
        this.convoGroupService.updateConversations2Store([
          <ConversationGroup>{
            ...convo,
            conversationGroupId: convo.conversationGroupId,
            status: Status.archived
          }
        ]);
      }
    }
  }

  private transferCustomTxns(txns: Txn[]) {
    const list: TxnCustom[] = [];
    txns.forEach(t => {
      const index = list.findIndex(item => item.customerUuid === t.customerUuid && item.inboxUuid === t.inboxUuid);
      if (index === -1) {
        list.push(<TxnCustom>{
          listTxns: [t.txnUuid],
          customerUuid: t.customerUuid,
          unreadCount: t.unreadCount || 0,
          inboxUuid: t.inboxUuid
        });
      } else {
        list[index].listTxns.push(t.txnUuid);
        const count = t.unreadCount || 0;
        list[index].unreadCount += count;
      }
    });
    return list;
  }

  // when navigate route -> active convo -> update list view channel
  private subscribeActiveChannel() {
    // if contact page, active store cannot trigger -> cannot render channel and conversation
    this.channelCs$ = this.convoHelperService.selectChannelByFilter();
    this.channelDMs$ = this.convoHelperService.selectDirectChat();
    this.channelPersonals$ = this.convoHelperService.selectChannePersonal();

    this.watchMentionCount();

    combineLatest([
      this.channelQuery.selectActiveId(),
      this.convoGroupQuery.selectActiveId(),
      this.channelHyperspaceQuery.selectActiveId()
    ])
      .pipe(takeUntil(this.destroySubscriber$), debounceTime(10))
      .subscribe(_ => {
        this.channelCs$ = this.convoHelperService.selectChannelByFilter();
        this.channelDMs$ = this.convoHelperService.selectDirectChat();
        this.channelPersonals$ = this.convoHelperService.selectChannePersonal();
      });
  }

  private watchMentionCount() {
    this.channelQuery
      .selectCount(entity => {
        const dm = entity.type === ChannelType.dm && entity.unreadCount > 0;
        if (dm) {
          return dm;
        }

        const myChannel = entity.isMyChannel && !entity.archivedAt;
        const gc = myChannel && entity.type === ChannelType.gc && entity.mentionCount > 0;
        return gc;
      })
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(totalUnread => {
        if (totalUnread !== this._totalUnread) {
          this._totalUnread = totalUnread;
          this.appService.update({
            mentionCountTeamChat: this._totalUnread
          });
          X.fireMessageToParent<UpdateNoticationData>(MethodName.UpdateNotificationCount, <UpdateNoticationData>{
            notification: totalUnread
          });
        }
      });
  }

  private fetchConvos() {
    this.channelService.updateStateStore({
      showAll: this.isShowAllChannel
    });
    // re-select
    this.channelCs$ = this.convoHelperService.selectChannelByFilter();
    this.channelDMs$ = this.convoHelperService.selectDirectChat();
    this.channelPersonals$ = this.convoHelperService.selectChannePersonal();
  }

  private stopPropagation(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private detectOS() {
    if (navigator.appVersion.indexOf('Win') !== -1) {
      this._OSName = OS.Windows;
    } else if (navigator.appVersion.indexOf('Mac') !== -1) {
      this._OSName = OS.MacOS;
    } else if (navigator.appVersion.indexOf('X11') !== -1) {
      this._OSName = OS.UNIX;
    } else if (navigator.appVersion.indexOf('Linux') !== -1) {
      this._OSName = OS.Linux;
    }
  }

  private getTypeTxn(data: CaseMessageData) {
    return data.txnType === TxnType.chat
      ? data.channel === ChatTypeTxn.livechat
        ? 'Livechat'
        : data.channel === ChatTypeTxn.whatsapp
        ? 'Whatsapp'
        : 'Chat'
      : this.capitalizeCasePipe.transform(data.txnType);
  }

  private openMenuTeamChat(event: KeyboardEvent) {
    const menuElr = this.elr?.nativeElement?.querySelector('.menu-teamchat');
    if (menuElr) {
      this.stopPropagation(event);
      menuElr.dispatchEvent(new Event('click'));
    }
  }

  private initLivechatV2() {
    this.meQuery.me$
      .pipe(
        filter(x => x != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(me => {
        this.me = me;

        this.inboxV2$ = this.txnQuery
          .selectTxnsAssignToMeV2(this.me.identityUuid)
          .pipe(map(txns => this.transferCustomTxns(txns)));

        // await init ws
        this.chatService.socketStatus$
          .pipe(
            filter(s => s === SocketStatus.opened),
            take(1)
          )
          .subscribe(_ => {
            this.fetchTxnsV2();
          });

        // reconnected
        this.chatService.socketStatus$
          .pipe(
            filter(status => status === SocketStatus.opened),
            skip(1),
            takeUntil(this.destroySubscriber$)
          )
          .subscribe(_ => {
            this.fetchTxnsV2();
          });

        this.onmessage$ = this.chatService.onmessage().pipe(
          takeUntil(this.destroySubscriber$),
          filter(msg => msg != null && msg?.mt === MsgType.case),
          tap(message => {
            this.processV2(message);
          })
        );
      });
  }

  private initLivechatV1() {
    combineLatest([this.ccMeQuery.me$, this.meQuery.me$])
      .pipe(
        filter(([meCC, me]) => meCC != null && me != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([meCC, me]) => {
        this.me = me;
        const isSupervisor = meCC?.isSupervisor;

        this.selectUnreadCountInbox$ = this.txnQuery.selectUnreadCountInbox(this.me.identityUuid);

        this.inbox$ = this.txnQuery
          .selectTxnsAssignToMe(this.me.identityUuid)
          .pipe(map(txns => this.transferCustomTxns(txns)));
        this.endChat$ = this.txnQuery
          .selectClosedTxn(this.me.identityUuid)
          .pipe(map(txns => this.transferCustomTxns(txns)));

        if (isSupervisor) {
          this.assignedToOther$ = this.txnQuery
            .selectTxnsAssignToOther(this.me.identityUuid)
            .pipe(map(txns => this.transferCustomTxns(txns)));

          this.unassigned$ = this.txnQuery.selectTxnsPending().pipe(map(txns => this.transferCustomTxns(txns)));
          this.endChatOrg$ = this.txnQuery.selectClosedTxn().pipe(map(txns => this.transferCustomTxns(txns)));
        }

        // recent call
        this.hasExtCallcenter = false;
        this.isNormalExt = false;
        if (meCC?.type === ExtType.NORMAL) {
          // show rencent call
          this.isNormalExt = true;
        } else if (meCC?.type === ExtType.CALL_CENTER) {
          this.hasExtCallcenter = true;
          // await init ws
          this.chatService.socketStatus$
            .pipe(
              filter(s => s === SocketStatus.opened),
              take(1)
            )
            .subscribe(_ => {
              this.identityProfileQuery
                .selectProfileOrg(X.orgUuid)
                .pipe(
                  filter(x => x != null),
                  takeUntil(this.destroySubscriber$),
                  take(1)
                )
                .subscribe(org => {
                  this.fetchTxns();

                  // const timeRange = TimeRangeHelper.buildTimeRangeFromKey(TimeRangeKey.last90days, this.timeZone);
                  // const req = <GetReportV4Payload>{
                  //   startTime: timeRange.startDate,
                  //   endTime: timeRange.endDate,
                  //   orgUuid: X.orgUuid,
                  //   filter: {
                  //     status: 'end', // "ongoing"
                  //     agentUuids: this.me.identityUuid
                  //   }
                  // };

                  // const endTxnsUWState = this.appQuery.endTxnsUWState();
                  // this.fetchEndTxns(req, new Pageable(endTxnsUWState.page || 1, endTxnsUWState.perPage || 100), false);

                  if (this.isSupervisor) {
                    // const req1 = <GetReportV4Payload>{
                    //   startTime: timeRange.startDate,
                    //   endTime: timeRange.endDate,
                    //   orgUuid: X.orgUuid,
                    //   filter: {
                    //     status: 'end' // "ongoing"
                    //   }
                    // };
                    // const endTxnsOrgUWState = this.appQuery.endTxnsUWOrgState();
                    // this.fetchEndTxns(
                    //   req1,
                    //   new Pageable(endTxnsOrgUWState.page || 1, endTxnsOrgUWState.perPage || 100),
                    //   true
                    // );
                  }
                });
            });

          // reconnected
          this.chatService.socketStatus$
            .pipe(
              filter(status => status === SocketStatus.opened),
              skip(1),
              takeUntil(this.destroySubscriber$)
            )
            .subscribe(_ => {
              this.fetchTxns();
            });
        }
      });
  }
}

enum OS {
  Windows = 'Windows',
  MacOS = 'MacOS',
  UNIX = 'UNIX',
  Linux = 'Linux'
}

export interface TxnCustom {
  listTxns: string[];
  customerUuid: string;
  customerName: string;
  type: ContactType;
  unreadCount: number;
  inboxUuid: string;
}

export interface CallCustom {
  phoneCustomer: string;
  phoneNunbers: string[];
  emails: string[];
  contactUuid: string;
  isGuidRandom: boolean;
}
