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
import { AppService, SidebarTabs, Txn, TxnQuery, TxnService } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, LocalStorageUtil, X } from '@b3networks/shared/common';
import { Order } from '@datorama/akita';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-list-txns',
  templateUrl: './list-txns.component.html',
  styleUrls: ['./list-txns.component.scss']
})
export class ListTxnsComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('viewport', { static: false }) viewport: ElementRef | null;

  txns$: Observable<Txn[]>;
  contact$: Observable<Contact>;
  viewDate$: Observable<number>;
  ChatTypeTxn = ChatTypeTxn;
  changeTab$: Observable<TabTxn>;

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
            // maping lastAssignedAgents ,get active-txns api
            this.txnQuery.loaded$
              .pipe(
                filter(x => x),
                take(1)
              )
              .subscribe(_ => {
                const activeTxns = this.txnQuery.getAll({
                  filterBy: entity => !entity.isClosed && !entity.inboxUuid && entity.customerUuid === customer.uuid,
                  sortBy: 'createdAt',
                  sortByOrder: Order.DESC
                });
                if (activeTxns.length > 0) {
                  this.contactService.updateUIViewState(contactUuid, <ContactUI>{
                    selectTab:
                      activeTxns[0].txnType !== TxnType.chat
                        ? TabTxn.call
                        : activeTxns[0].channel === ChatTypeTxn.livechat
                        ? TabTxn.livechat
                        : TabTxn.whatsapp
                  });

                  this.txns$ = this.contactQuery.selectTabTxnByContact(contactUuid).pipe(
                    distinctUntilChanged(),
                    switchMap((tab: TabTxn) =>
                      tab === TabTxn.call
                        ? this.txnQuery.selectTxnsByCustomerAndType(contactUuid, TxnType.autodialer, 'active')
                        : tab === TabTxn.livechat
                        ? this.txnQuery.selectTxnsByCustomerAndType(
                            contactUuid,
                            TxnType.chat,
                            'active',
                            ChatTypeTxn.livechat
                          )
                        : tab === TabTxn.whatsapp
                        ? this.txnQuery.selectTxnsByCustomerAndType(
                            contactUuid,
                            TxnType.chat,
                            'active',
                            ChatTypeTxn.whatsapp
                          )
                        : of([])
                    ),
                    debounceTime(50),
                    tap((txns: Txn[]) => {
                      const me = this.meQuery.getMe();
                      if (txns[txns.length - 1]?.lastAssignedAgents) {
                        this.appService.update({ sidebarTabActive: SidebarTabs.teamchat });
                      }

                      if (txns.length > 0) {
                        this.filterWhatsapps(txns, customer);
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
