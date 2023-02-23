import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Member } from './member';

export function createInitialState(): OrgMemberState {
  return {} as OrgMemberState;
}

export interface OrgMemberState extends EntityState<Member>, ActiveState {
  hasPendingMember: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_org_members', idKey: 'uuid' })
export class OrgMemberStore extends EntityStore<OrgMemberState> {
  constructor() {
    super(createInitialState());
  }
}
