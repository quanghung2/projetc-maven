import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { InvoiceState, UserInvoiceStore } from './user-invoice.store';

@Injectable({
  providedIn: 'root'
})
export class UserInvoiceQuery extends QueryEntity<InvoiceState> {
  selectedFilterDate$ = this.select(state => state.ui.filterDate);
  slectedInvoiceStatus$ = this.select(state => state.ui.selectedStatus);
  loading$ = this.selectLoading();
  invoices$ = this.selectAll();

  constructor(protected override store: UserInvoiceStore) {
    super(store);
  }
}
