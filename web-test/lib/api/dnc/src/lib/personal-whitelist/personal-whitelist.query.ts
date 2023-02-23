import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { PersonalWhitelistState, PersonalWhitelistStore } from './personal-whitelist.store';

@Injectable({ providedIn: 'root' })
export class PersonalWhitelistQuery extends QueryEntity<PersonalWhitelistState> {
  get hasGrantedPersonalWhitelist() {
    return this.getValue()?.hasGrantedPersonalWhitelist;
  }

  constructor(protected override store: PersonalWhitelistStore) {
    super(store);
  }
}
