import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ConfigStaticDataSource } from '../common.model';

export interface DataSource {
  uuid: string;
  data: ConfigStaticDataSource[];
}
export interface DataSourceState extends EntityState<DataSource> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_datasource', idKey: 'uuid', resettable: true })
export class DataSourceStore extends EntityStore<DataSourceState> {
  constructor() {
    super();
  }
}
