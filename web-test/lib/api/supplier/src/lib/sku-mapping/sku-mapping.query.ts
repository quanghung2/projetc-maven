import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SkuMappingState, SkuMappingStore } from './sku-mapping.store';

@Injectable({ providedIn: 'root' })
export class SkuMappingQuery extends QueryEntity<SkuMappingState> {
  skuMappings$ = this.selectAll();

  constructor(protected override store: SkuMappingStore) {
    super(store);
  }
}
