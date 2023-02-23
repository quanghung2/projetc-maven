import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ContactGroupState, ContactGroupStore } from './contact-group.store';

@Injectable({ providedIn: 'root' })
export class ContactGroupQuery extends QueryEntity<ContactGroupState> {
  constructor(protected override store: ContactGroupStore) {
    super(store);
  }
}
