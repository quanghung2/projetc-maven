import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BuyerWalletState, BuyerWalletStore } from './buyer-wallet.store';

@Injectable({ providedIn: 'root' })
export class BuyerWalletQuery extends QueryEntity<BuyerWalletState> {
  constructor(protected override store: BuyerWalletStore) {
    super(store);
  }
}
