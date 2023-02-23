import { Org } from './org.model';

export class User {
  orgUuid: string;
  identityUuid: string;
  name: string;
  phoneNumber: string;
  email: string;
  avatarUrl: string;
  role: string;
  domain: string;
  org: Org;
  pin: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      obj.org = new Org(obj?.org);
    }
  }

  get isAdmin() {
    return this.role === 'ADMIN';
  }
}
