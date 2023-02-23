import { Injectable } from '@angular/core';
import { ID, Order, QueryConfig, QueryEntity } from '@datorama/akita';
import { BundleItem } from './bundle.model';
import { BundleState, BundleStore } from './bundle.store';

@Injectable({ providedIn: 'root' })
@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC
})
export class BundleQuery extends QueryEntity<BundleState> {
  constructor(protected override store: BundleStore) {
    super(store);
  }

  selectOne(id: ID) {
    return this.selectEntity(id);
  }

  getOne(id: ID) {
    return this.getEntity(id);
  }

  getNumberItems(ids: ID[]): BundleItem[] {
    return this.getAll()
      .filter(b => ids.includes(b.id))
      .map(b => b.numbersItems)
      .reduce((a, b) => [...a, ...b], []);
  }
}
