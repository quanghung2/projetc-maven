import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { BlackList } from './member-contacts.model';

export interface ContactState {
  blacklist: BlackList[];
  whitelist: BlackList[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'contact_member_contacts' })
export class MemberContactsStore extends Store<ContactState> {
  constructor() {
    super({
      blacklist: [],
      whitelist: []
    });
  }
}
