export class PersonalWhitelistEnabled {
  identityUuid: string;
  enabled: boolean;

  constructor(obj?: Partial<PersonalWhitelistEnabled>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class PersonalWhitelist {
  number: string;
  voice: boolean; // true to indicate whitelisted (false is not blacklisted but is just not whitelisted)
  sms: boolean;
  fax: boolean;
}
