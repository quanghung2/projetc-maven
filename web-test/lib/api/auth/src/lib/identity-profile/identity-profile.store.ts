import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Team } from '../team/team.model';
import { IdentityProfile, ProfileOrg } from './identity-profile.model';

export interface ProfileState {
  profile: IdentityProfile;
  currentOrg: ProfileOrg;
  teams: Team[];
}

export function createInitialState(): ProfileState {
  return { teams: [] } as ProfileState;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_identity_profile' })
export class IdentityProfileStore extends Store<ProfileState> {
  constructor() {
    super(createInitialState());
  }
}
