import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { DataSourceState, DataSourceStore } from './data-source.store';

@Injectable({ providedIn: 'root' })
export class DataSourceQuery extends QueryEntity<DataSourceState> {
  constructor(protected override store: DataSourceStore) {
    super(store);
  }

  selectDataSource(valueListUuid: string) {
    return this.selectEntity(valueListUuid, entity => entity.data);
  }
}
