import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { Contact, ContactFilterBy, ContactQuery, TabTxn } from '@b3networks/api/contact';
import { Inbox, InboxesQuery } from '@b3networks/api/inbox';
import { MeQuery, NetworkService, User } from '@b3networks/api/workspace';
import {
  AssignLeftReq,
  CreateSmsComponent,
  SelectContactComponent,
  StoreContactComponent,
  Txn,
  TxnQuery,
  TxnService
} from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, renderLinkForCopy } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Order } from '@datorama/akita';
import { ClipboardService } from 'ngx-clipboard';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly ContactFilterBy = ContactFilterBy;

  @Input() contactActive: Contact;

  txn$: Observable<Txn>;
  convoTxns$: Observable<string[]>;
  isMemberTxn: boolean;
  isInboxFlow: boolean;
  inbox$: Observable<Inbox>;

  private _loadingDetailTxn: boolean;
  private _contactUuid: string;

  constructor(
    private dialog: MatDialog,
    private webrtcQuery: WebrtcQuery,
    private webrtcService: WebrtcService,
    private networkService: NetworkService,
    private toastService: ToastService,
    private contactQuery: ContactQuery,
    private clipboardService: ClipboardService,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private meQuery: MeQuery,
    private router: Router,
    private route: ActivatedRoute,
    private inboxesQuery: InboxesQuery
  ) {
    super();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactActive'] && this._contactUuid !== this.contactActive?.uuid) {
      this._contactUuid = this.contactActive.uuid;

      this.isInboxFlow = this.router?.url?.includes('/txns/inboxes/');
      const inboxUuid = this.route?.firstChild?.firstChild?.snapshot?.params?.['inboxUuid'];

      this.inbox$ = this.inboxesQuery.selectEntity(inboxUuid);

      this.convoTxns$ = this.contactQuery.selectTabTxnByContact(this.contactActive.uuid).pipe(
        filter(tab => tab === TabTxn.livechat),
        distinctUntilChanged(),
        switchMap(() => this.txnQuery.selectAllTxnsByCustomer(this.contactActive.uuid, Order.DESC)),
        switchMap(txns =>
          this.txnQuery.selectMany(
            txns.map(x => x.txnUuid),
            entity => entity.txnUuid
          )
        ),
        debounceTime(100) // has call api get private note
      );

      this.txn$ = this.contactQuery.selectTabTxnByContact(this.contactActive.uuid).pipe(
        filter(tab => tab === TabTxn.livechat),
        distinctUntilChanged(),
        switchMap(() =>
          this.isInboxFlow && inboxUuid
            ? this.txnQuery.selectAll({
                filterBy: entity =>
                  entity.customerUuid === this.contactActive.uuid &&
                  entity.inboxUuid === inboxUuid &&
                  entity.channel === ChatTypeTxn.livechat &&
                  !entity.isClosed,
                sortBy: 'createdAt',
                sortByOrder: Order.DESC,
                limitTo: 1
              })
            : this.txnQuery.selectTxnsByCustomerAndType(
                this.contactActive.uuid,
                TxnType.chat,
                'active',
                ChatTypeTxn.livechat,
                Order.DESC
              )
        ),
        map(txns => txns?.[0]),
        filter(x => !!x),
        debounceTime(50),
        tap(txn => {
          this.isMemberTxn = txn?.lastAssignedAgents?.includes(this.meQuery.getMe()?.identityUuid);

          if (!this._loadingDetailTxn) {
            this._loadingDetailTxn = true;
            this.fetchDetailTxn(txn);
          }
        })
      );
    }
  }

  left(txn: Txn) {
    if (txn?.inboxUuid) {
      this.txnService
        .leftTxnV2(txn.txnUuid, this.meQuery.getMe().identityUuid)
        .pipe(switchMap(_ => this.txnService.join(txn.txnUuid))) // read history msg
        .subscribe();
    } else {
      this.txnService
        .left(<AssignLeftReq>{
          txnUuid: txn.txnUuid,
          agentUuid: this.meQuery.getMe().identityUuid
        })
        .pipe(switchMap(_ => this.txnService.join(txn.txnUuid))) // read history msg
        .subscribe();
    }
  }

  copyLink() {
    this.clipboardService.copyFromContent(renderLinkForCopy(this.router));
    this.toastService.success('Copy link successfully!');
  }

  call() {
    if (this.contactActive.numbers?.length > 1) {
      this.selectContact();
    } else {
      this.makeCallTo(this.contactActive.numbers?.[0]?.number);
    }
  }

  editContact(contact: User | Contact) {
    this.dialog.open(StoreContactComponent, { minWidth: '400px', data: contact });
  }

  sms(contact: Contact) {
    this.dialog.open(CreateSmsComponent, {
      width: '450px',
      maxHeight: '410px',
      data: { identityUuid: this.contactActive.uuid, number: contact.numbers?.[0]?.number }
    });
  }

  selectContact() {
    this.dialog
      .open(SelectContactComponent, {
        minWidth: '400px',
        data: { contact: this.contactActive }
      })
      .afterClosed()
      .subscribe(number => {
        this.makeCallTo(number);
      });
  }

  // only call with WebRTC
  makeCallTo(number: string) {
    if (!this.webrtcQuery.UA?.isRegistered()) {
      this.toastService.error(
        'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
      );
      return;
    }

    if (this.webrtcQuery.isBusy) {
      this.toastService.error('You are on a call process.');
      return;
    }

    if (!this.networkService.isOnline) {
      this.toastService.warning(
        "Your computer seems to be offline. We'll keep trying to reconnect, or you can try refresh your browser",
        10e3
      );
      return;
    }

    this.webrtcService.makeCallOutgoing(number, this.contactActive);
  }

  private fetchDetailTxn(txn: Txn) {
    const ui = this.txnQuery.getUiState(txn.txnUuid);
    if (!ui.loadedDetail) {
      this.txnService
        .getDetailTxn(txn.txnUuid)
        .pipe(
          finalize(() => {
            this.txnService.updateTxnViewState(txn.txnUuid, {
              loadedDetail: true
            });
            this._loadingDetailTxn = false;
          })
        )
        .subscribe();
    }
  }
}
