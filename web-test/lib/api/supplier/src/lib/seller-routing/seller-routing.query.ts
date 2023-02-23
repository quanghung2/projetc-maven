import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SellerRoutingState, SellerRoutingStore } from './seller-routing.store';

@Injectable({ providedIn: 'root' })
export class SellerRoutingQuery extends QueryEntity<SellerRoutingState> {
  sellerRoutings$ = this.selectAll();

  constructor(protected override store: SellerRoutingStore) {
    super(store);
  }
}
