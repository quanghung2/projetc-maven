export class MemberInfoModel {
  role: EnumRoleMemnber;
  displayName: string;
  uuid: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum EnumRoleMemnber {
  GUEST = 'GUEST',
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN'
}
