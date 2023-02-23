import { Injectable } from '@angular/core';
import { contains } from '@b3networks/shared/common';
import { QueryEntity } from '@datorama/akita';
import { AgentState, AgentStore } from './agent.store';

@Injectable({ providedIn: 'root' })
export class AgentQuery extends QueryEntity<AgentState> {
  agents$ = this.selectAll();

  constructor(protected override store: AgentStore) {
    super(store);
  }

  getAllAgents() {
    return this.getAll();
  }

  getAllAgentsContains(key: string) {
    return this.getAll({
      filterBy: e => contains(e.displayText, key)
    });
  }

  selectAllAgentsContains(key: string) {
    return this.selectAll({
      filterBy: e => contains(e.displayText, key)
    });
  }
}
