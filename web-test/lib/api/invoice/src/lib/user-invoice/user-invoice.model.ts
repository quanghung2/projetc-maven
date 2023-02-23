export enum InvoiceStatus {
  paid = 'PAID',
  sent = 'SENT',
  partialPaid = 'PARTIALLY_PAID'
}

export class Invoice {
  number: string;
  pdfUrl: string;
  amount: number;
  amountDue: number;
  paidAmount: number;
  currency: string;
  issuedDate: number;
  status: InvoiceStatus;

  constructor(obj?: Partial<Invoice>) {
    Object.assign(this, obj);
  }

  get isPartialPayment() {
    return this.status === InvoiceStatus.partialPaid;
  }

  get isNoPayment() {
    return this.status === InvoiceStatus.sent;
  }

  get isPaid() {
    return this.status === InvoiceStatus.paid;
  }
}

export interface SearchInvoiceReq {
  startDate: number;
  endDate: number;
  awaitingPayment: boolean;
  paid: boolean;
}
