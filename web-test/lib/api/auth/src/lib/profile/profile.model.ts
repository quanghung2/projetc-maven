export class Profile {
  domain: string;
  identityUuid: string;
  intro: string;
  name: string;
  orgUuid: string;
  photoUrl: string;
  title: string;
  uid: string | number;

  iid: string;
  iname: string;
  oid: string;
  oname: string;
  description: string;

  constructor(obj?: Partial<Profile>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
