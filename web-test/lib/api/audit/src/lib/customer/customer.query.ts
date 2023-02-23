import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { ModuleDescription } from './customer.model';
import { AuditSearchState, CustomerStore } from './customer.store';

@Injectable({
  providedIn: 'root'
})
export class CustomerQuery extends QueryEntity<AuditSearchState> {
  loading$ = this.selectLoading();
  audits$ = this.selectAll({ sortBy: 'moduleDescription', sortByOrder: Order.ASC });

  constructor(protected override store: CustomerStore) {
    super(store);
  }

  getUi() {
    return this.getValue().ui;
  }

  getEventName(module: ModuleDescription) {
    return this.getValue().entities[module];
  }
}
