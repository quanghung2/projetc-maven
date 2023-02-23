export class CountryOutboundRule {
  id: string;
  name: string;
  code: string;

  constructor(obj?: Partial<CountryOutboundRule>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum UpdateCountryAction {
  'ADD' = 'ADD',
  'REMOVE' = 'REMOVE'
}
