import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Agent } from './agent-config';

export interface AgentState extends EntityState<Agent> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_agent', idKey: 'identityUuid' })
export class AgentStore extends EntityStore<AgentState> {
  constructor() {
    super();
  }
}
