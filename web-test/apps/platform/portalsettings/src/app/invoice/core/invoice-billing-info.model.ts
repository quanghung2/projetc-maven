import { Country } from '../../core/models/country.model';

export class InvoiceBillingInfo {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country = new Country({});
  emails = new Array<string>();
}
