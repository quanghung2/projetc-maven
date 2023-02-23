import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { filter, map } from 'rxjs/operators';
import { IdentityProfileStore, ProfileState } from './identity-profile.store';

@Injectable({ providedIn: 'root' })
export class IdentityProfileQuery extends Query<ProfileState> {
  profile$ = this.select('profile');
  currentOrg$ = this.select('currentOrg');
  roleCurrentOrg$ = this.select(entity => entity?.currentOrg?.role);
  teams$ = this.select('teams');
  licenseEnabled$ = this.select('currentOrg').pipe(map(x => x?.licenseEnabled));

  uuid$ = this.select(s => s.profile?.uuid).pipe(filter(uuid => !!uuid));

  get identityUuid() {
    return this.getProfile().uuid;
  }

  get currentOrg() {
    return this.getValue().currentOrg;
  }

  constructor(protected override store: IdentityProfileStore) {
    super(store);
  }

  selectProfileOrg(orgUuid: string) {
    return this.profile$.pipe(
      filter(x => x != null),
      map(profile => profile.organizations.find(org => org.orgUuid === orgUuid))
    );
  }

  getProfile() {
    return this.getValue().profile;
  }

  getProfileOrg(orgUuid: string) {
    return this.getProfile().getOrganizationByUuid(orgUuid);
  }
}
