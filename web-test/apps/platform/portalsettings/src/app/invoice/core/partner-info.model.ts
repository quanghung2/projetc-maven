import { InvoiceBillingInfo } from './invoice-billing-info.model';

export class PartnerInfo {
  domain: string;
  uuid: string;
  name: string;
  logo: string;
  supportedCurrencies = new Array<string>();
  billingInfo = new InvoiceBillingInfo();
}
