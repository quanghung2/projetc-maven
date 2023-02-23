export class TaxVatConfig {
  public orgUuid: string;
  public countryCode: string;
  public taxNumber: string;
  public taxable: boolean;

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

export class TaxVatConfigExtended extends TaxVatConfig {
  isEditing = false;
  isNew = false;
  mappingCountry: CountryMapping = { applicableCountries: [] };

  constructor(value: Object, isNew?: boolean, mappingCountry?: CountryMapping) {
    super(value);
    if (!!isNew) {
      this.isNew = isNew;
      this.isEditing = true;
      this.taxable = true;
    }
    if (mappingCountry) {
      this.mappingCountry = mappingCountry;
    }
  }

  isValid(): boolean {
    return !!this.countryCode && !!this.taxNumber && this.taxNumber.trim().length > 0;
  }
}

export interface CountryMapping {
  forAllNotSpecified?: boolean,
  applicableCountries: string[]
}
