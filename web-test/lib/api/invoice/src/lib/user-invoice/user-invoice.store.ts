import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Invoice, InvoiceStatus } from './user-invoice.model';

export interface InvoiceState extends EntityState<Invoice> {
  ui: {
    filterDate: Date;
    selectedStatus: InvoiceStatus | any;
  };
}

const initialState = {
  ui: {
    filterDate: new Date(),
    selectedStatus: ''
  }
};

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'invoice_user-invoice', idKey: 'number' })
export class UserInvoiceStore extends EntityStore<InvoiceState> {
  constructor() {
    super(initialState);
  }

  updateFilterDate(date: Date) {
    this.update(state => ({ ...state, ui: { ...state.ui, filterDate: date } }));
  }

  updateSelectedStatus(invoiceStatus: InvoiceStatus) {
    this.update(state => ({ ...state, ui: { ...state.ui, selectedStatus: invoiceStatus } }));
  }
}
