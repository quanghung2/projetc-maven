import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AuthorConnector } from './author.model';
import { AuthorConnectorStore } from './connector.store';

@Injectable({ providedIn: 'root' })
export class AuthorConnectorQuery extends Query<AuthorConnector> {
  constructor(protected override store: AuthorConnectorStore) {
    super(store);
  }
}
