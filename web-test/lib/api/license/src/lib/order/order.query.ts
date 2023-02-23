import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { OrderState, OrderStore } from './order.store';

@Injectable({ providedIn: 'root' })
export class OrderQuery extends QueryEntity<OrderState> {
  orders$ = this.selectAll();

  constructor(protected override store: OrderStore) {
    super(store);
  }
}
