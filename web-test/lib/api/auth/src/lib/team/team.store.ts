import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, HashMap, StoreConfig } from '@datorama/akita';
import { Team } from './team.model';

export interface TeamState extends EntityState<Team>, ActiveState {
  loadedOrgs: HashMap<boolean>; // mapping between orgUuid with loaded boolean
}

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'auth_team', idKey: 'uuid' })
export class TeamStore extends EntityStore<TeamState> {
  constructor() {
    super({ loadedOrgs: {} });
  }
}
