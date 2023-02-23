import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { ProfileGoogle } from './oauth.model';

export interface OauthState {
  tokenSocial: string;
  google: ProfileGoogle;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_oauth' })
export class ExternalOAuthStore extends Store<OauthState> {
  constructor() {
    super({
      google: null,
      tokenSocial: null
    });
  }
}
