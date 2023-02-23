export class Counter {
  public type: string;
  public prefix: string;
  public current: number;
  public length: number;

  constructor(json?: Partial<Counter>) {
    if (json) {
      Object.assign(this, json);
    }
  }

  isInvoice(): boolean {
    return this.type === 'INVOICE';
  }

  isTopupInvoice(): boolean {
    return this.type === 'TOPUP_INVOICE';
  }

  isProformaInvoice(): boolean {
    return this.type === 'PROFORMA_INVOICE';
  }

  isTaxInvoice(): boolean {
    return this.type === 'TAX_INVOICE';
  }

  isCreditNote(): boolean {
    return this.type === 'CREDIT_NOTE';
  }

  isMonthlyInvoice(): boolean {
    return this.type === 'MONTHLY_INVOICE';
  }
}
