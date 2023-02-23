export class Owner {
  displayName: string;
  email: string;
  mobileNumber: string;
  uuid: string;
  constructor(obj?: Partial<Owner>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Channel {
  domain: string;
  partnerUuid: string;
  partnerName: string;
  createDate: number;
  owner: Owner;
  defaultCurrency: string;

  constructor(obj?: Partial<Channel>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
