import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { JobBulkFilter } from './bulk-filter.model';

export interface BulkFilterState extends EntityState<JobBulkFilter> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'dnc-bulk-filter', idKey: 'bulkUuid' })
export class BulkFilterStore extends EntityStore<BulkFilterState> {
  constructor() {
    super();
  }
}
