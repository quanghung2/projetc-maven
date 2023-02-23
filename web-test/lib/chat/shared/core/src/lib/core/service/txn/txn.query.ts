import { Injectable } from '@angular/core';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { EntityUIQuery, Order, QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { TxnUI } from './txn-ui.model';
import { Txn } from './txn.model';
import { TxnState, TxnStore, TxnUIState } from './txn.store';

@Injectable({ providedIn: 'root' })
export class TxnQuery extends QueryEntity<TxnState> {
  override ui: EntityUIQuery<TxnUIState>;

  loaded$ = this.select('loaded');
  loadedV2$ = this.select('loadedV2');
  hasMorePending$ = this.select('statePending').pipe(map(x => x?.hasMore));

  constructor(protected override store: TxnStore) {
    super(store);
    this.createUIQuery();
  }

  getTxn(txnUuid: string) {
    return this.getEntity(txnUuid);
  }

  selectPropertyTXN<K extends keyof Txn>(id: string, property: K) {
    return this.selectEntity(id, property);
  }

  selectUIState<K extends keyof TxnUI>(id: string, property: K) {
    return this.ui.selectEntity(id, property);
  }

  getUiState(txnUuid: string) {
    return this.ui.getEntity(txnUuid);
  }

  hasMorePending() {
    return this.select(entity => entity?.statePending?.hasMore || entity?.statePendingV2?.hasMore);
  }

  hasMoreActive() {
    return this.select(entity => entity?.stateActiveV2?.hasMore);
  }

  selectClosedTxn(meIdentity?: string) {
    return this.selectAll({
      filterBy: entity =>
        entity.isClosed &&
        !entity?.inboxUuid &&
        (!meIdentity || entity?.lastAssignedAgents?.findIndex(identityUuid => identityUuid === meIdentity) > -1),
      sortBy: 'createdAt',
      sortByOrder: Order.DESC
    });
  }

  selectTxnsAssignToMe(meIdentity: string) {
    return this.selectAll({
      filterBy: entity =>
        !entity.isClosed &&
        !entity.inboxUuid &&
        entity?.lastAssignedAgents?.findIndex(identityUuid => identityUuid === meIdentity) > -1,
      sortBy: 'createdAt'
    });
  }

  selectTxnsAssignToMeV2(meIdentity: string) {
    return this.selectAll({
      filterBy: entity =>
        !entity.isClosed &&
        !!entity.inboxUuid &&
        entity?.lastAssignedAgents?.findIndex(identityUuid => identityUuid === meIdentity) > -1,
      sortBy: 'createdAt'
    });
  }

  selectTxnsAssignToOther(meIdentity: string) {
    return this.selectAll({
      filterBy: entity =>
        !entity.isClosed &&
        !entity?.inboxUuid &&
        entity?.lastAssignedAgents?.length > 0 &&
        entity?.lastAssignedAgents?.findIndex(identityUuid => identityUuid === meIdentity) === -1,
      sortBy: 'createdAt'
    });
  }

  selectTxnsHasAgents() {
    return this.selectAll({
      filterBy: entity => !entity.isClosed && !entity?.inboxUuid && entity?.lastAssignedAgents?.length > 0,
      sortBy: 'createdAt'
    });
  }

  selectTxnsNoAgents() {
    return this.selectAll({
      filterBy: entity => !entity.isClosed && !entity?.inboxUuid && entity?.lastAssignedAgents?.length === 0,
      sortBy: 'createdAt'
    });
  }

  selectTxnsPending() {
    return this.selectAll({
      filterBy: entity =>
        !entity.isClosed &&
        !entity?.inboxUuid &&
        (!entity?.lastAssignedAgents || entity?.lastAssignedAgents?.length === 0),
      sortBy: 'createdAt'
    });
  }

  selectAllTxnsByCustomer(contactUuid: string, order = Order.DESC) {
    return this.selectAll({
      filterBy: entity => entity.customerUuid === contactUuid && !entity?.inboxUuid,
      sortBy: 'createdAt',
      sortByOrder: order
    });
  }

  selectTxnsByCustomerAndType(
    contactUuid: string,
    txnType: TxnType,
    statusTxn: 'all' | 'active' | 'closed',
    channel?: ChatTypeTxn,
    order = Order.ASC
  ) {
    if (txnType === TxnType.chat) {
      return this.selectAll({
        filterBy: entity =>
          entity.customerUuid === contactUuid &&
          !entity?.inboxUuid &&
          entity.txnType === TxnType.chat &&
          entity.channel === channel &&
          (statusTxn === 'active' ? !entity.isClosed : statusTxn === 'closed' ? entity.isClosed : statusTxn === 'all'),
        sortBy: 'createdAt',
        sortByOrder: order
      });
    }

    // call
    return this.selectAll({
      filterBy: entity =>
        entity.customerUuid === contactUuid &&
        !entity?.inboxUuid &&
        entity.txnType !== TxnType.chat &&
        (statusTxn === 'active' ? !entity.isClosed : statusTxn === 'closed' ? entity.isClosed : statusTxn === 'all'),
      sortBy: 'createdAt',
      sortByOrder: order
    });
  }

  selectUnreadCountInbox(meIdentity: string) {
    return this.selectCount(entity => {
      const isInbox =
        !entity.isClosed &&
        !entity?.inboxUuid &&
        entity?.lastAssignedAgents?.findIndex(identityUuid => identityUuid === meIdentity) > -1;
      return isInbox && entity.unreadCount > 0;
    }).pipe(map(count => count > 0));
  }

  selectTxnsByCustomer(
    contactUuid: string,
    inboxUuid: string,
    statusTxn: 'all' | 'active' | 'closed',
    channel: ChatTypeTxn,
    order = Order.ASC
  ) {
    return this.selectAll({
      filterBy: entity =>
        entity.customerUuid === contactUuid &&
        entity.inboxUuid === inboxUuid &&
        entity.channel === channel &&
        (statusTxn === 'active' ? !entity.isClosed : statusTxn === 'closed' ? entity.isClosed : statusTxn === 'all'),
      sortBy: 'createdAt',
      sortByOrder: order
    });
  }
}
