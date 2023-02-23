import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { DirectoryMemberState, DirectoryMemberStore } from './member.store';

@Injectable({ providedIn: 'root' })
export class DirectoryMemberQuery extends QueryEntity<DirectoryMemberState> {
  members$ = this.selectAll();

  constructor(protected override store: DirectoryMemberStore) {
    super(store);
  }

  getMember(uuid: string) {
    return this.getEntity(uuid);
  }
}
