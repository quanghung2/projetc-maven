import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { Contact, ContactQuery, ContactService, ContactUI, TabTxn, UserContactType } from '@b3networks/api/contact';
import { V4Service } from '@b3networks/api/data';
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
import { AppService, SidebarTabs, Txn, TxnQuery, TxnService, TxnStatus } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, LocalStorageUtil, X } from '@b3networks/shared/common';
import { Order } from '@datorama/akita';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-list-inbox-txns',
  templateUrl: './list-inbox-txns.component.html',
  styleUrls: ['./list-inbox-txns.component.scss']
})
export class ListInboxTxnsComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('viewport', { static: false }) viewport: ElementRef | null;

  inboxUuid: string;
  txns$: Observable<Txn[]>;
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
    this.appService.update({ sidebarTabActive: SidebarTabs.teamchat });
    this.identityProfileQuery.currentOrg$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(x => x != null)
      )
      .subscribe(currentOrg => {
        this.timeZone = currentOrg.utcOffset;
      });

    this.activeRoute?.parent?.parent?.parent.params.subscribe(params => {
      if (params?.['contactUuid']) {
        const contactUuid = params?.['contactUuid'];
        this.inboxUuid = this.activeRoute.snapshot?.params?.['inboxUuid'];
        if (this.inboxUuid) {
          this.contactUuid = contactUuid;
          LocalStorageUtil.setItem(`lastestView_v1_${X.orgUuid}`, encodeURIComponent(this.router.url));

          this.viewDate$ = this.contactQuery.selectUIState(contactUuid, 'viewDate');
          this.changeTab$ = this.contactQuery.selectTabTxnByContact(contactUuid);
          this.contact$ = this.contactQuery.selectEntity(contactUuid);

          this.txnService
            .getTxnByCustomer([TxnStatus.active, TxnStatus.pending, TxnStatus.ended], contactUuid, this.inboxUuid)
            .subscribe(data => {
              this.contactQuery
                .selectEntity(contactUuid)
                .pipe(
                  filter(x => x != null),
                  take(1),
                  takeUntil(this.destroySubscriber$)
                )
                .subscribe(customer => {
                  // maping lastAssignedAgents ,get query txns api
                  this.txnQuery.loadedV2$
                    .pipe(
                      filter(x => x),
                      take(1)
                    )
                    .subscribe(_ => {
                      const allTxns = this.txnQuery.getAll({
                        filterBy: entity =>
                          entity.customerUuid === customer.uuid && entity.inboxUuid === this.inboxUuid,
                        sortBy: 'createdAt',
                        sortByOrder: Order.DESC
                      });
                      if (allTxns.length > 0) {
                        this.contactService.updateUIViewState(contactUuid, <ContactUI>{
                          selectTab:
                            !allTxns?.length || allTxns[0].channel === ChatTypeTxn.livechat
                              ? TabTxn.livechat
                              : TabTxn.whatsapp
                        });
                        // store end txn
                        this.storeConversation(allTxns, customer);

                        this.txns$ = this.contactQuery.selectTabTxnByContact(contactUuid).pipe(
                          distinctUntilChanged(),
                          switchMap((tab: TabTxn) =>
                            tab === TabTxn.livechat
                              ? this.txnQuery.selectTxnsByCustomer(
                                  contactUuid,
                                  this.inboxUuid,
                                  'active',
                                  ChatTypeTxn.livechat
                                )
                              : tab === TabTxn.whatsapp
                              ? this.txnQuery.selectTxnsByCustomer(
                                  contactUuid,
                                  this.inboxUuid,
                                  'active',
                                  ChatTypeTxn.whatsapp
                                )
                              : of([])
                          ),
                          debounceTime(50),
                          tap((txns: Txn[]) => {
                            if (txns.length > 0) {
                              this.storeConversation(txns, customer);
                            }
                          })
                        );
                      } else {
                        // no txns
                        this.contactService.updateUIViewState(contactUuid, <ContactUI>{
                          selectTab: TabTxn.livechat
                        });
                        this.appService.update({ sidebarTabActive: SidebarTabs.teamchat });
                      }
                    });
                });
            });
        }
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

  private storeConversation(txns: Txn[], customer: Contact) {
    const userUuid = this.meQuery.getMe().userUuid;
    txns.forEach(item => {
      const store = this.convoGroupQuery.getEntity(item.txnUuid);
      if (!store) {
        this.addConversation2Store(item, customer);
      }
      const teamConvo = this.convoGroupQuery.getEntity(item?.teamConvoId);
      if (item?.teamConvoId && !teamConvo) {
        this.addTeamConversation(item, customer);
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

  private addTeamConversation(txn: Txn, contact: Contact) {
    const convo = new ConversationGroup(<Partial<ConversationGroup>>{
      conversationGroupId: txn.teamConvoId,
      conversations: [
        {
          conversationId: txn.teamConvoId,
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
      type: GroupType.Customer
    });

    this.convoGroupService.addConversation2Store(convo);
  }
}
