import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { OrgLink } from './org-link.model';

export function createInitialState(): OrgLinkState {
  return {} as OrgLinkState;
}

export interface OrgLinkState extends EntityState<OrgLink>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'org-link', idKey: 'uuid' })
export class OrgLinkStore extends EntityStore<OrgLinkState> {
  constructor() {
    super(createInitialState());
  }
}
