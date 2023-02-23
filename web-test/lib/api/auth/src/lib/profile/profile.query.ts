import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Profile } from './profile.model';
import { ProfileStore } from './profile.store';

@Injectable({ providedIn: 'root' })
export class ProfileQuery extends Query<Profile> {
  profile$ = this.select();

  constructor(protected override store: ProfileStore) {
    super(store);
  }
}
