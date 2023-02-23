import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { SellerRouting } from './seller-routing.model';

export interface SellerRoutingState extends EntityState<SellerRouting> {}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'supplier_seller-routing' })
export class SellerRoutingStore extends EntityStore<SellerRoutingState> {
  constructor() {
    super();
  }
}
