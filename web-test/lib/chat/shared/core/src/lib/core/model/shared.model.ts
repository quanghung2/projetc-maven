import { IdentityProfile, LoginSessionResponse, ProfileOrg } from '@b3networks/api/auth';

export enum TypeContact {
  member = 'member',
  customer = 'customer'
}

export interface LandingData {
  profiles: IdentityProfile;
  currentOrg: ProfileOrg;
  session: LoginSessionResponse;
}
