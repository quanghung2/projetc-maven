import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { PersonalWhitelistEnabled } from './personal-whitelist.model';

export interface PersonalWhitelistState extends EntityState<PersonalWhitelistEnabled> {
  hasGrantedPersonalWhitelist: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'dnc-personal-whitelist',
  idKey: 'identityUuid'
})
export class PersonalWhitelistStore extends EntityStore<PersonalWhitelistState> {
  constructor() {
    super({
      hasGrantedPersonalWhitelist: false
    });
  }
}
