import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ContactGroup } from './contact-group.model';

export interface ContactGroupState extends EntityState<ContactGroup>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'contact_group', idKey: 'uuid' })
export class ContactGroupStore extends EntityStore<ContactGroupState> {
  constructor() {
    super();
  }
}
