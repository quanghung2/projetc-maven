import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AuthorDataSourceState, AuthorDataSourceStore } from './datasource.store';

@Injectable({ providedIn: 'root' })
export class AuthorDataSourceQuery extends QueryEntity<AuthorDataSourceState> {
  constructor(protected override store: AuthorDataSourceStore) {
    super(store);
  }
}
