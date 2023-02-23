import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Contact, ContactService } from '@b3networks/api/contact';
import {
  AppQuery,
  AppService,
  ModeSidebar,
  RespActivePendingTxn,
  TxnQuery,
  TxnService
} from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { TeamInboxFiter, TxnCustom } from '../sidebar.component';

const PENDING_SIZE = 20;

@Component({
  selector: 'b3n-team-inbox',
  templateUrl: './team-inbox.component.html',
  styleUrls: ['./team-inbox.component.scss']
})
export class TeamInboxComponent implements OnInit, OnChanges {
  @Input() isLoadingMorePending: boolean;
  @Input() isLoadingActiveTxn: boolean;
  @Input() selectedFiter: TeamInboxFiter;
  @Input() assignedToOther: TxnCustom[];
  @Input() unassigned: TxnCustom[];
  @Input() endChatOrg: TxnCustom[];

  @Output() loadmoreEndtxn = new EventEmitter<boolean>();

  hasMorePending$: Observable<boolean>;
  hasMoreEndTxns$: Observable<boolean>;

  readonly TeamInboxFiter = TeamInboxFiter;

  constructor(
    private appService: AppService,
    private appQuery: AppQuery,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private contactService: ContactService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['endChatOrg']) {
      this.hasMoreEndTxns$ = this.appQuery.hasMoreEndTxnsOrg$;
    }
  }

  ngOnInit() {
    this.hasMorePending$ = this.txnQuery.hasMorePending$;
  }

  closeSidebar($event) {
    $event.stopPropagation();
    const mode = this.appQuery.getValue()?.modeLeftSidebar;
    if (mode === ModeSidebar.over) {
      setTimeout(() => {
        this.appService.update({
          showLeftSidebar: false
        });
      }, 50);
    }
  }

  trackByTxn(_, item: TxnCustom) {
    return item?.customerUuid;
  }

  loadMore() {
    this.loadmoreEndtxn.emit(true);
  }

  loadMorePending() {
    let state = this.txnQuery.getValue()?.statePending;
    if (!state) {
      state = {
        page: 1,
        perPage: PENDING_SIZE
      };
    }

    this.isLoadingMorePending = true;
    this.txnService
      .getPending({ page: state.page + 1, perPage: state.perPage })
      .pipe(
        tap((data: RespActivePendingTxn) => this.storeContacts(data.contacts)),
        finalize(() => (this.isLoadingMorePending = false))
      )
      .subscribe();
  }

  private storeContacts(contacts: Contact[]) {
    if (contacts?.length > 0) {
      this.contactService.updateContacts2Store(contacts);
    }
  }
}
