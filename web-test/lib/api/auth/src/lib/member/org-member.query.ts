import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { OrgMemberState, OrgMemberStore } from './org-member.store';
@Injectable({ providedIn: 'root' })
export class OrgMemberQuery extends QueryEntity<OrgMemberState> {
  members$ = this.selectAll();

  memberUuids$ = this.selectAll().pipe(map(l => l.map(i => i.uuid)));

  constructor(protected override store: OrgMemberStore) {
    super(store);
  }

  selectAllByUuids(uuids: string[] = []) {
    return this.selectAll({
      filterBy: e => uuids.includes(e.uuid)
    });
  }

  selectPolicyDocument(uuid: string) {
    return this.selectEntity(uuid, 'policyDocument');
  }

  getMember(uuid: string) {
    return this.getEntity(uuid);
  }

  getMemberSearch(keyword: string, meUuid?: string) {
    return this.selectAll({
      filterBy: e => e.displayName.toLowerCase().includes(keyword.toLowerCase()) && e.uuid != meUuid,
      limitTo: 10
    });
  }

  getAllMemberSearch(keyword: string) {
    return this.getAll({
      filterBy: e => e.displayName.toLowerCase().includes(keyword.toLowerCase()),
      limitTo: 10
    });
  }
}
