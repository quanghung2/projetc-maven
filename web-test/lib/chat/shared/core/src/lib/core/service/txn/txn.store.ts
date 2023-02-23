import { Injectable } from '@angular/core';
import { EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { TxnUI } from './txn-ui.model';
import { Txn } from './txn.model';

export interface TxnState extends EntityState<Txn> {
  loaded: boolean;
  loadedV2: boolean;
  statePending: {
    hasMore?: boolean;
    page?: number;
    perPage?: number;
  };
  stateActiveV2: {
    hasMore?: boolean;
    page?: number;
    perPage?: number;
  };
  statePendingV2: {
    hasMore?: boolean;
    page?: number;
    perPage?: number;
  };
}

export type TxnUIState = EntityState<TxnUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'chat-shared-core-txn', idKey: 'txnUuid' })
export class TxnStore extends EntityStore<TxnState> {
  override ui: EntityUIStore<TxnUIState>;

  constructor() {
    super({
      loaded: false,
      loadedV2: false
    });

    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(
      entity =>
        <TxnUI>{
          loadedDetail: false
        }
    );
  }
}
