export class User {
  uuid: string;
  orgUuid: string;
  mobileNumber: string;
  email: string;
  name: string;
  countryCode: string;
  timezone: string;
  domain: string;
  role: string = Role[Role.MEMBER];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get utcOffset(): string {
    return this.timezone ? this.timezone.substring(3, 8) : '+0800';
  }

  get isEnableAdminMode(): boolean {
    return (
      this.orgUuid == '9ace93b2-69ab-4dce-8ac0-1849fe242a07' && [Role[Role.ADMIN], Role[Role.OWNER]].includes(this.role)
    );
  }

  get isAdmin(): boolean {
    return this.role === Role[Role.OWNER] || this.role === Role[Role.ADMIN] || this.role === Role[Role.SUPER_ADMIN];
  }
}

export enum Role {
  OWNER,
  ADMIN,
  MEMBER,
  SUPER_ADMIN
}
