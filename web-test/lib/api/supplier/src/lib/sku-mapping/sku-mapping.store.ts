import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { SkuMapping } from './sku-mapping.model';

export interface SkuMappingState extends EntityState<SkuMapping> {}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'supplier_sku-mapping' })
export class SkuMappingStore extends EntityStore<SkuMappingState> {
  constructor() {
    super();
  }
}
