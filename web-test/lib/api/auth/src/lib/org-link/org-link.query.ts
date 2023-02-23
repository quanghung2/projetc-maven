import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { OrgLinkState, OrgLinkStore } from './org-link.store';

@Injectable({ providedIn: 'root' })
export class OrgLinkQuery extends QueryEntity<OrgLinkState> {
  constructor(protected override store: OrgLinkStore) {
    super(store);
  }
}
