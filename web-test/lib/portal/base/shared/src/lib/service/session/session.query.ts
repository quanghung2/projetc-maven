import { Injectable } from '@angular/core';
import { ProfileOrg } from '@b3networks/api/auth';
import { LocalStorageUtil } from '@b3networks/shared/common';
import { Query } from '@datorama/akita';
import { differenceInSeconds } from 'date-fns';
import { orderBy } from 'lodash';
import { map, shareReplay } from 'rxjs/operators';
import { REMEMBER_ME_KEY, SessionState, SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class SessionQuery extends Query<SessionState> {
  isLoggedIn$ = this.select('sessionExpipryAt').pipe(
    // tap(v => {
    //   console.log(`Expiry at changed ${v}, new date ${new Date()}`);
    //   if (v) {
    //     console.log(`Expiry difference in seconds with current ${differenceInSeconds(v, new Date())}`);
    //   }
    // }),
    map(v => v != null && differenceInSeconds(v, new Date()) > 10)
  );

  isRefreshingToken$ = this.select(state => state.refreshingToken);
  profile$ = this.select('profile');
  currentOrg$ = this.select('currentOrg').pipe(shareReplay(1));
  servicedOrgs$ = this.select('servicedOrgs');
  hasServicedOrg$ = this.select('servicedOrgs').pipe(map(list => list && list.length > 0));

  constructor(protected override store: SessionStore) {
    super(store);
  }

  get hasRememberMe() {
    return LocalStorageUtil.getItem(REMEMBER_ME_KEY) != null;
  }

  get profile() {
    return this.getValue().profile;
  }

  get currentOrg() {
    return this.getValue().currentOrg;
  }

  get isRefreshingToken() {
    return this.getValue().refreshingToken === true;
  }

  get isValidatedSession() {
    return this.getValue().validatedSession;
  }

  searchOrgs(q?: string): ProfileOrg[] {
    const list = this.getValue().profile?.organizations || [];
    return orderBy(
      list.filter(org => {
        let expression = true;
        if (q) {
          q = q.toLowerCase();
          expression = org.orgName?.toLowerCase().includes(q) || org.orgUuid.toLowerCase().includes(q);
        }
        return expression;
      }),
      ['isPartner', 'orgName'],
      ['desc', 'asc']
    );
  }

  searchServicedOrgs(q?: string): ProfileOrg[] {
    const list = this.getValue().servicedOrgs || [];
    return orderBy(
      list.filter(org => {
        let expression = true;
        if (q) {
          q = q.toLowerCase();
          expression = org.orgName?.toLowerCase().includes(q) || org.orgUuid.toLowerCase().includes(q);
        }
        return expression;
      }),
      'orgName',
      'asc'
    );
  }
}
