import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { DialogPosition, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Pageable } from '@b3networks/api/common';
import { Contact, ContactService } from '@b3networks/api/contact';
import { Inbox, InboxesQuery } from '@b3networks/api/inbox';
import { ChatService, MeQuery, User } from '@b3networks/api/workspace';
import {
  AssignedMode,
  RequestFilterTxns,
  RespActivePendingTxn,
  Txn,
  TxnGroupBy,
  TxnQuery,
  TxnService,
  TxnStatus
} from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, TimeRangeKey } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Order } from '@datorama/akita';
import { Observable } from 'rxjs';
import { filter, finalize, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { InviteMemberTxnComponent } from '../../shared';
import {
  PreviewHistoryTxnComponent,
  PreviewHistoryTxnData
} from '../../shared/component/preview-history-txn/preview-history-txn.component';

const PENDING_SIZE = 50;

@Component({
  selector: 'b3n-assigned-chats',
  templateUrl: './assigned-chats.component.html',
  styleUrls: ['./assigned-chats.component.scss']
})
export class AssignedChatsComponent extends DestroySubscriberComponent implements OnInit {
  hasSessionChat$: Observable<boolean>;
  data: MatTableDataSource<Txn>;
  count = 0;
  hasMoreActive$: Observable<boolean>;
  isLoadingMoreActive: boolean;
  inboxes$: Observable<Inbox[]>;
  inboxCtr = new UntypedFormControl('All');

  private _me: User;

  readonly columns = ['txnUuid', 'inboxUuid', 'channel', 'createdAt', 'numOfAgent', 'customer', 'actions'];
  readonly TimeRangeKey = TimeRangeKey;

  get searchKey() {
    const key = this.inboxCtr.value;
    return typeof key === 'string' && key !== 'All' ? key : '';
  }

  constructor(
    private toastService: ToastService,
    private dialog: MatDialog,
    private meQuery: MeQuery,
    private chatService: ChatService,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private cdr: ChangeDetectorRef,
    private contactService: ContactService,
    private inboxesQuery: InboxesQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.hasSessionChat$ = this.chatService.session$.pipe(map(x => !!x));
    this.hasMoreActive$ = this.txnQuery.hasMoreActive();
    this.inboxes$ = this.inboxesQuery.all$;

    this.meQuery.me$
      .pipe(
        filter(x => x != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(me => {
        this._me = me;
        this.inboxCtr.valueChanges
          .pipe(startWith(this.inboxCtr.value), takeUntil(this.destroySubscriber$))
          .pipe(
            switchMap(value => {
              if (value instanceof Inbox) {
                return this.txnQuery.selectAll({
                  filterBy: entity =>
                    entity.inboxUuid === value?.uuid && !entity.isClosed && entity?.lastAssignedAgents?.length > 0,
                  sortBy: 'createdAt',
                  sortByOrder: Order.DESC
                });
              }
              return this.txnQuery.selectAll({
                filterBy: entity => !entity.isClosed && entity?.lastAssignedAgents?.length > 0,
                sortBy: 'createdAt',
                sortByOrder: Order.DESC
              });
            })
          )
          .subscribe(txns => {
            this.initDatasource(txns);
          });
      });
  }

  inviteChat(txn: Txn) {
    this.dialog.open(InviteMemberTxnComponent, {
      width: '600px',
      data: { txn: txn },
      disableClose: true
    });
  }

  viewHistory(txn: Txn, event: MouseEvent) {
    event.stopPropagation();
    this.dialog.open(PreviewHistoryTxnComponent, {
      data: <PreviewHistoryTxnData>{
        txnActive: txn
      },
      width: '50%',
      minWidth: '800px',
      height: '100%',
      maxWidth: 'unset',
      position: <DialogPosition>{ right: '0px' },
      panelClass: 'preview-message',
      autoFocus: false
    });
  }

  displayFn(inbox: Inbox | string): string {
    return inbox === 'All' ? 'All' : (<Inbox>inbox)?.name;
  }

  trackTask(index: number, item: Txn): string {
    return item?.txnUuid;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  loadMoreActive() {
    let stateActiveV2 = this.txnQuery.getValue()?.stateActiveV2;
    const me = this.meQuery.getMe();
    if (stateActiveV2?.hasMore) {
      if (!stateActiveV2) {
        stateActiveV2 = {
          page: 1,
          perPage: PENDING_SIZE
        };
      }

      this.isLoadingMoreActive = true;
      this.txnService
        .getTxnByFilter(
          <RequestFilterTxns>{
            status: TxnStatus.active,
            assignedMode: AssignedMode.all,
            groupBy: TxnGroupBy.txn
          },
          new Pageable(stateActiveV2.page + 1, stateActiveV2.perPage),
          me.identityUuid
        )
        .pipe(
          tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts)),
          finalize(() => (this.isLoadingMoreActive = false))
        )
        .subscribe();
    }
  }

  private storeContacts(contacts: Contact[]) {
    if (contacts?.length > 0) {
      this.contactService.updateContacts2Store(contacts);
    }
  }

  private initDatasource(txns: Txn[]) {
    this.count = txns?.length || 0;
    this.data = new MatTableDataSource(txns);
    this.cdr.detectChanges();
  }
}
