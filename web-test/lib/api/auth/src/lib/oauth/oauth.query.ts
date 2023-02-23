import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { ExternalOAuthStore, OauthState } from './oauth.store';

@Injectable({ providedIn: 'root' })
export class ExternalOAuthQuery extends Query<OauthState> {
  google$ = this.select('google');

  constructor(protected override store: ExternalOAuthStore) {
    super(store);
  }

  getTokenSocial() {
    return this.getValue().tokenSocial;
  }

  getGoogle() {
    return this.getValue().google;
  }
}
