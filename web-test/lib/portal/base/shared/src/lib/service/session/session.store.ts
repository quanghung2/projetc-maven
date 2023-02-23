import { Injectable } from '@angular/core';
import { IdentityProfile, ProfileOrg } from '@b3networks/api/auth';
import { Store, StoreConfig } from '@datorama/akita';

export const SESSION_KEY = 'sessionToken';
export const REMEMBER_ME_KEY = 'rememberMe';
export const TRUSTED_BROWSER = 'trustedBrowserID';
export const REFRESHING_TOKEN = 'refreshingToken';
export const REFRESHING_TOKEN_TIMEOUT = 10 * 1000;

export interface SessionState {
  validatedSession?: boolean;
  sessionExpipryAt?: Date;
  fallbackSessionToken?: string;
  profile: IdentityProfile;
  currentOrg: ProfileOrg;
  servicedOrgs: ProfileOrg[];
  refreshingToken?: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'portal_session' })
export class SessionStore extends Store<SessionState> {
  constructor() {
    super({});
  }

  logout() {
    this.reset();
  }
}
