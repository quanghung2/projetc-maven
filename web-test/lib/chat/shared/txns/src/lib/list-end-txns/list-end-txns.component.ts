import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Contact, ContactQuery, ContactService, ContactUI, TabTxn, UserContactType } from '@b3networks/api/contact';
import { GetReportV4Payload, Period, ReportV4Code, TxnChatLog, TxnStatusChat, V4Service } from '@b3networks/api/data';
import {
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationType,
  CustomerInfo,
  GroupType,
  MeQuery,
  Status
} from '@b3networks/api/workspace';
import { AppService, SidebarTabs, Txn, TxnQuery, TxnService } from '@b3networks/chat/shared/core';
import {
  DestroySubscriberComponent,
  LocalStorageUtil,
  TimeRangeHelper,
  TimeRangeKey,
  X
} from '@b3networks/shared/common';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-list-end-txns',
  templateUrl: './list-end-txns.component.html',
  styleUrls: ['./list-end-txns.component.scss']
})
export class ListEndTxnsComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('viewport', { static: false }) viewport: ElementRef | null;

  endTxns$: Observable<Txn[]>;
  contact$: Observable<Contact>;
  viewDate$: Observable<number>;
  ChatTypeTxn = ChatTypeTxn;
  changeTab$: Observable<TabTxn>;

  private timeZone: string;
  private contactUuid: string;

  readonly TxnType = TxnType;
  readonly UserContactType = UserContactType;
  readonly TabTxn = TabTxn;

  constructor(
    private router: Router,
    private meQuery: MeQuery,
    private v4Service: V4Service,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private activeRoute: ActivatedRoute,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private contactQuery: ContactQuery,
    private contactService: ContactService,
    private identityProfileQuery: IdentityProfileQuery,
    private appService: AppService
  ) {
    super();
  }

  ngOnInit(): void {
    this.appService.update({ sidebarTabActive: SidebarTabs.team_inbox });
    this.identityProfileQuery.currentOrg$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(x => x != null)
      )
      .subscribe(currentOrg => {
        this.timeZone = currentOrg.utcOffset;
      });

    this.activeRoute?.parent?.parent?.parent?.params.pipe(takeUntil(this.destroySubscriber$)).subscribe(params => {
      const contactUuid = params['contactUuid'];
      if (params['contactUuid']) {
        this.contactUuid = contactUuid;
        LocalStorageUtil.setItem(`lastestView_v1_${X.orgUuid}`, encodeURIComponent(this.router.url));

        this.viewDate$ = this.contactQuery.selectUIState(contactUuid, 'viewDate');
        this.changeTab$ = this.contactQuery.selectTabTxnByContact(contactUuid);
        this.contact$ = this.contactQuery.selectEntity(contactUuid);

        this.contactQuery
          .selectEntity(contactUuid)
          .pipe(
            filter(x => x != null),
            take(1),
            takeUntil(this.destroySubscriber$)
          )
          .subscribe(customer => {
            const endTxns = this.txnQuery.getAll({
              filterBy: entity => entity.isClosed && entity.customerUuid === customer.uuid
            });

            if (endTxns.length === 0) {
              const timeRange = TimeRangeHelper.buildTimeRangeFromKey(TimeRangeKey.last30days, this.timeZone);
              const req = <GetReportV4Payload>{
                startTime: timeRange.startDate,
                endTime: timeRange.endDate,
                orgUuid: X.orgUuid,
                filter: {
                  status: 'end',
                  'customer.customerUuid': customer.uuid
                }
              };
              this.v4Service
                .getReportData<TxnChatLog>(Period.dump, ReportV4Code.chatUnifiedHistory, req, new Pageable(1, 5), false)
                .pipe(
                  map(resp => resp?.rows || []),
                  map(data => {
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
                    return txns;
                  })
                )
                .subscribe(closedTxn => {
                  this.initListTxn(customer, closedTxn);
                });
            } else {
              this.initListTxn(customer, endTxns);
            }
          });
      }
    });
  }

  trackByTxn(_, item: Txn) {
    return item.txnUuid;
  }

  onChangeTab(tab: TabTxn) {
    this.contactService.updateUIViewState(this.contactUuid, <ContactUI>{
      selectTab: tab
    });
  }

  private initListTxn(customer: Contact, closedTxns: Txn[]) {
    closedTxns = closedTxns.filter(x => x.isClosed).sort((a, b) => b.createdAt - a.createdAt);
    if (closedTxns.length > 0) {
      this.contactService.updateUIViewState(customer.uuid, <ContactUI>{
        selectTab:
          closedTxns[0].txnType !== TxnType.chat
            ? TabTxn.call
            : closedTxns[0].channel === ChatTypeTxn.livechat
            ? TabTxn.livechat
            : TabTxn.whatsapp
      });

      this.endTxns$ = this.contactQuery.selectTabTxnByContact(customer.uuid).pipe(
        distinctUntilChanged(),
        switchMap((tab: TabTxn) =>
          tab === TabTxn.call
            ? this.txnQuery.selectTxnsByCustomerAndType(customer.uuid, TxnType.autodialer, 'closed')
            : tab === TabTxn.livechat
            ? this.txnQuery.selectTxnsByCustomerAndType(customer.uuid, TxnType.chat, 'closed', ChatTypeTxn.livechat)
            : tab === TabTxn.whatsapp
            ? this.txnQuery.selectTxnsByCustomerAndType(customer.uuid, TxnType.chat, 'closed', ChatTypeTxn.whatsapp)
            : of([])
        ),
        debounceTime(50),
        tap((txns: Txn[]) => {
          if (txns.length > 0) {
            this.filterWhatsapps(txns, customer);
          }
        })
      );
    } else {
      // // no txns
      // this.contactService.updateUIViewState(customer.uuid, <ContactUI>{
      //   selectTab: TabTxn.livechat
      // });
      // this.appService.update({ sidebarTabActive: SidebarTabs.inbox });
    }
  }

  private filterWhatsapps(txns: Txn[], customer: Contact) {
    const chat = txns.filter(x => x.txnType === TxnType.chat);
    const userUuid = this.meQuery.getMe().userUuid;
    chat.forEach(item => {
      const store = this.convoGroupQuery.getEntity(item.txnUuid);
      if (!store) {
        this.addConversation2Store(item, customer);
      }
      if (item.channel === ChatTypeTxn.whatsapp && !store?.whatsappLastReceivedDate) {
        this.convoGroupService
          .getWhatsAppLiveChatDetail(
            item.txnUuid,
            customer,
            userUuid,
            GroupType.WhatsApp,
            item?.isClosed ? Status.archived : Status.opened
          )
          .subscribe();
      }
    });
  }

  private addConversation2Store(txn: Txn, contact: Contact) {
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
        uuid: contact?.uuid,
        name: contact?.displayName
      },
      createdAt: new Date(),
      status: txn.isClosed ? Status.archived : Status.opened,
      type: txn.channel === ChatTypeTxn.livechat ? GroupType.Customer : GroupType.WhatsApp
    });

    this.convoGroupService.addConversation2Store(convo);
  }
}
