import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { BuyerWallet } from './buyer-wallet.model';

export interface BuyerWalletState extends EntityState<BuyerWallet> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'buyer-wallet' })
export class BuyerWalletStore extends EntityStore<BuyerWalletState> {

  constructor() {
    super();
  }

}
