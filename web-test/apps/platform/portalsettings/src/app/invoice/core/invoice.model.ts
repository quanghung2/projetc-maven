import { StringUtils } from '../../utils/string-utils';
import { InvoiceBillingInfo } from './invoice-billing-info.model';
import { InvoiceItem } from './invoice-item.model';
import { InvoiceRecipient } from './invoice-recipient.model';

export class Invoice {
  domain: string;
  number: string;
  name: string;
  type: string;
  topup: boolean = true;
  amount: number; // raw amount
  amountDue: number; // total amount after less credit notes and payments
  paidAmount: number; // total payment amounts
  adjustingAmount: number; // total credit note amounts
  currency: string;
  taxNumber: string;
  companyRegistrationNumber: string;
  billedOrgUuid: string;
  billedWalletUuid: string;
  billedInfo = new InvoiceBillingInfo();
  status: string = InvoiceStatus[InvoiceStatus.DRAFT];
  provisionStatus: string = ProvisionStatus[ProvisionStatus.OPEN];
  readonly: boolean;
  unpaidNote: string = '';
  paidNote: string = '';
  issuedDate: number = new Date().getTime();
  items = new Array<InvoiceItem>();
  recipients = new Array<InvoiceRecipient>();

  constructor(isTopup: boolean = false) {
    this.type = InvoiceType[InvoiceType.INVOICE];
    this.topup = isTopup;
  }

  isDraft(): boolean {
    return this.status === InvoiceStatus[InvoiceStatus.DRAFT];
  }

  isSent(): boolean {
    return this.status === InvoiceStatus[InvoiceStatus.SENT];
  }

  isPaid(): boolean {
    return this.status === InvoiceStatus[InvoiceStatus.PAID];
  }

  isInvoice(): boolean {
    return this.type === InvoiceType[InvoiceType.INVOICE];
  }

  isCreditNote(): boolean {
    return this.type === InvoiceType[InvoiceType.CREDIT_NOTE];
  }

  isValid(): boolean {
    return this.isValidInvoice(this) && this.isValidItemList(this.items) && this.isValidRecipientList(this.recipients);
  }

  private isValidInvoice(invoice: Invoice): boolean {
    return (
      invoice != null &&
      !StringUtils.isBlank(invoice.type) &&
      !StringUtils.isBlank(invoice.name) &&
      !StringUtils.isBlank(invoice.billedOrgUuid)
    );
  }

  private isValidItemList(itemList: Array<InvoiceItem>): boolean {
    return itemList.filter(i => i.isValid()).length > 0;
  }

  private isValidRecipientList(recipientList: Array<InvoiceRecipient>): boolean {
    return recipientList.filter(r => r.isValid()).length > 0;
  }
}

export enum InvoiceType {
  INVOICE,
  CREDIT_NOTE,
  OVERPAYMENT
}

export enum InvoiceStatus {
  DRAFT,
  SENT,
  PAID,
  VOIDED
}

export enum ProvisionStatus {
  OPEN,
  IN_PROGRESS,
  COMPLETED,
  FAILED
}

export class AssociatedInfo {
  associated: boolean;
  associatedInvoice: Invoice;

  constructor() {
    this.associated = false;
  }
}
