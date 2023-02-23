import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Supplier } from './supplier.model';

export interface SupplierState extends EntityState<Supplier> {}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'supplier' })
export class SupplierStore extends EntityStore<SupplierState> {
  constructor() {
    super();
  }
}
