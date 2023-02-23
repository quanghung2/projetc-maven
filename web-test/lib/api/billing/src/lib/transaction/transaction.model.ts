export class TransactionsBalance {
  key: string;
  closingBalance: number;
  description: string;
  quantity: number;
  items: TransactionsBalance[] = [];
  totalAmount: number;
  type: string;
  createAt: string;
  amount?: number;
  createdAt?: string;
  currencyCode?: string;
  txnRef?: string;
  groupTxnRef?: string;
  invoiceGroup?: string;

  constructor(obj?: Partial<TransactionsBalance>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
