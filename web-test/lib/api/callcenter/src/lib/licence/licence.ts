export class Licence {
  orgUuid: string;
  identityUuid: string;
  extensionKey: string;
  extensionLabel: string;
  type: LicenceType;

  get licenceString() {
    return `${this.extensionKey}-${this.extensionLabel}`;
  }

  constructor(type: LicenceType, obj?: any) {
    Object.assign(this, obj);
    this.type = type;
  }
}

export enum LicenceType {
  agent = 'agent',
  supervisor = 'supervisor'
}
