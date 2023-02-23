import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Server } from './server.model';

export interface ServerState extends EntityState<Server>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'edge_server', idKey: '_idKey' })
export class ServerStore extends EntityStore<ServerState> {
  constructor() {
    super();
  }
}
