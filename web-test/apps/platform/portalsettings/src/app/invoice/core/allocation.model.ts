import { Invoice } from './invoice.model';

export class Allocation {
  id: number;
  invoice: Invoice;
  allocateInvoice: Invoice;
  amount: number;
  type: string;
  createdDate: number = new Date().getTime();
  updatedDate: number;

  isCreditNote(): boolean {
    return this.type === AllocationType[AllocationType.CREDIT_NOTE];
  }
}

export enum AllocationType {
  CREDIT_NOTE
}
