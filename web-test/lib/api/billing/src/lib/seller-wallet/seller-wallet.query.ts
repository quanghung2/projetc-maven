import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SellerWalletState, SellerWalletStore } from './seller-wallet.store';

@Injectable({ providedIn: 'root' })
export class SellerWalletQuery extends QueryEntity<SellerWalletState> {
  sellerUuids$ = this.select('sellerUuids');
  wallets$ = this.selectAll();

  constructor(protected override store: SellerWalletStore) {
    super(store);
  }

  selectWalletsBySeller(sellerUuid: string) {
    return this.selectAll({
      filterBy: e => e.sellerUuid === sellerUuid
    });
  }
}
