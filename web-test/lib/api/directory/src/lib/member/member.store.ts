import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { DirectoryMember } from './member';

export function createInitialState(): DirectoryMemberState {
  return {} as DirectoryMemberState;
}

export interface DirectoryMemberState extends EntityState<DirectoryMember>, ActiveState {
  hasPendingMember: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'directory_members', idKey: 'memberUuid' })
export class DirectoryMemberStore extends EntityStore<DirectoryMemberState> {
  constructor() {
    super(createInitialState());
  }
}
