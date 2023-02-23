export class TaxRate {
  public id: number;
  public name: string;
  public countryCode: string;
  public rate: number;

  constructor(value?: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}
