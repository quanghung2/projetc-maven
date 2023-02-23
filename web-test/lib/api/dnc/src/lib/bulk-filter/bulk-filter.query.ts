import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { BulkFilterState, BulkFilterStore } from './bulk-filter.store';

@Injectable({ providedIn: 'root' })
export class BulkFilterQuery extends QueryEntity<BulkFilterState> {
  selectAll$ = this.selectAll({
    sortBy: 'created',
    sortByOrder: Order.DESC
  });

  constructor(protected override store: BulkFilterStore) {
    super(store);
  }

  selectJobById(bulkId: string) {
    return this.selectEntity(bulkId);
  }
}
