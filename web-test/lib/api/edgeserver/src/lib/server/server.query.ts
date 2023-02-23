import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ServerState, ServerStore } from './server.store';

@Injectable({ providedIn: 'root' })
export class ServerQuery extends QueryEntity<ServerState> {
  constructor(protected override store: ServerStore) {
    super(store);
  }
}
