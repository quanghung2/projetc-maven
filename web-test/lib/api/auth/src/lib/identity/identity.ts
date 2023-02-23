export enum MemberRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum IdentityStatus {
  suspended = 'SUSPENDED',
  active = 'ACTIVE'
}

export const UPPER_ADMIN_ROLES = [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.SUPER_ADMIN];

export class Identity {
  uuid: string;
  memberUuid: string;
  mobileNumber: string;
  email: string;
  username: string;
  unverifiedEmail: string;
  unverifiedEmailToken: string;
  givenName: string;
  familyName: string;
  displayName: string;
  courtryCode: string;
  createdDateTime: string;
  timezone: string;
  photoUrl: string;
  domain: string;
  status: IdentityStatus;
  identityStatus: IdentityStatus;
  title: string;
  about: string;

  get shortUuid() {
    return this.uuid.substr(0, 8) + '...';
  }

  get photoUrlOrDefault() {
    return this.hasPhoto ? this.photoUrl : 'https://b3networks-ui.s3.amazonaws.com/icons/user.svg';
  }

  get hasPhoto() {
    return !!this.photoUrl && this.photoUrl.indexOf('http') > -1;
  }

  get isSuspended() {
    return this.identityStatus === IdentityStatus.suspended;
  }

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
