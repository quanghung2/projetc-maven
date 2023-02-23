import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { SellerWallet } from './seller-wallet.model';

export interface SellerWalletState extends EntityState<SellerWallet> {
  sellerUuids: string[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'billing_seller-wallet', idKey: 'walletRef' })
export class SellerWalletStore extends EntityStore<SellerWalletState> {
  constructor() {
    super();
  }
}
