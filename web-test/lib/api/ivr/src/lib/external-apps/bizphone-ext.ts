export class BizphoneExt {
  extKey: string;
  extLabel: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
export class BizphoneExtGroups {
  extGroupKey: string;
  name: string;
}

export class BizPhoneConferenceRoom {
  roomNumber: string;
}
