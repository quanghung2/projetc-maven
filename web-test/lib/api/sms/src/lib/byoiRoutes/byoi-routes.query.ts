import { Injectable } from '@angular/core';
import { QueryConfig, QueryEntity } from '@datorama/akita';
import { ByoiRoutesStore, ByoiRouteState } from './byoi-routes.store';

@QueryConfig({
  sortBy: 'id'
})
@Injectable({ providedIn: 'root' })
export class ByoiRoutesQuery extends QueryEntity<ByoiRouteState> {
  constructor(protected override store: ByoiRoutesStore) {
    super(store);
  }
}
