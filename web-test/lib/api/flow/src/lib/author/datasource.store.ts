import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { AuthorDataSource } from './author.model';

export interface AuthorDataSourceState extends EntityState<AuthorDataSource> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_auth_datasource', idKey: 'uuid' })
export class AuthorDataSourceStore extends EntityStore<AuthorDataSourceState> {
  constructor() {
    super();
  }
}
