export interface CreateSmppReq {
  developerLicence: string;
}

export class Smpp {
  systemId: string;
  password: string;
  maxConnections: string;

  constructor(obj?: Partial<Smpp>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayPassword(): string {
    return (
      this.password
        ?.split('')
        ?.map(() => '●')
        ?.join('') || ''
    );
  }
}
