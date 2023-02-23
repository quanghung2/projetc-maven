import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { AuthorConnector } from './author.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_author_connector', resettable: true })
export class AuthorConnectorStore extends Store<AuthorConnector> {
  constructor() {
    super(new AuthorConnector({}));
  }
}
