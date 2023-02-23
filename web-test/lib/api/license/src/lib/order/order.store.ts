import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Order } from './order.model';

export interface OrderState extends EntityState<Order> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'license_order' })
export class OrderStore extends EntityStore<OrderState> {
  constructor() {
    super();
  }
}
