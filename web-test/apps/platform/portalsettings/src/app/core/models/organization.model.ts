export class GetMemberResponse {
  domain: string;
  memberUuid: string;
  memberStatus: string;
  role: string;

  constructor(value: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }

  isActive(): boolean {
    return this.memberStatus === 'ACTIVE';
  }

  isOwner(): boolean {
    return this.role === 'OWNER';
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }
}

export class Organization {
  uuid: string;
  name: string;
  billingInfo = new BillingInfo({});

  constructor(value: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          if (key === 'billingInfo') {
            this.billingInfo = new BillingInfo(value[key]);
          } else {
            this[key] = value[key];
          }
        }
      }
    }
  }
}

export class BillingInfo {
  name: string;
  addressLineOne: string;
  addressLineTwo: string;
  city: string;
  state: string;
  zip: string;
  countryCode: string;
  emails = new Array<string>();

  constructor(value: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}
