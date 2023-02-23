import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { CustomerChatBox } from './customers.model';
import { CustomersStore } from './customers.store';

@Injectable({ providedIn: 'root' })
export class CustomersQuery extends Query<CustomerChatBox> {
  answers$ = this.select('answers');
  ui$ = this.select('ui');

  constructor(protected override store: CustomersStore) {
    super(store);
  }

  get getUi() {
    return this.getValue().ui;
  }

  selectOpenView() {
    return this.select(state => state.ui.isOpenChat);
  }
}
