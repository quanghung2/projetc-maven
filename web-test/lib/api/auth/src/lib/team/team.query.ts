import { Injectable } from '@angular/core';
import { QueryConfig, QueryEntity } from '@datorama/akita';
import { TeamState, TeamStore } from './team.store';

@QueryConfig({
  sortBy: 'name'
})
@Injectable({
  providedIn: 'root'
})
export class TeamQuery extends QueryEntity<TeamState> {
  constructor(protected override store: TeamStore) {
    super(store);
  }

  selectAllByUuids(uuids: string[] = []) {
    return this.selectAll({
      filterBy: e => uuids.includes(e.uuid)
    });
  }

  selectAllManagedByAdmin(adminUuid: string) {
    return this.selectAll({
      filterBy: e => e.admins?.includes(adminUuid)
    });
  }

  selectPolicyDocument(uuid: string) {
    return this.selectEntity(uuid, 'policyDocument');
  }

  getByUuid(uuid: string) {
    return this.getEntity(uuid);
  }

  search(text: string) {
    return this.getAll({
      filterBy: e => e.name?.toLowerCase()?.includes(text?.toLowerCase())
    });
  }

  hasntLoaded(orgUuid: string) {
    return this.getValue().loadedOrgs[orgUuid] !== true;
  }
}
