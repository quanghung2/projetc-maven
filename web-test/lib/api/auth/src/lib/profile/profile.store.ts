import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Profile } from './profile.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_profiles', idKey: 'iid' })
export class ProfileStore extends Store<Profile> {
  constructor() {
    super({});
  }
}
