export class BuyerWallet {
  postpaid: boolean;
  currency: string;
  unbilled: number;
  billed: number;
  balance: number;
  reserved: number;
  creditLimit: number;

  constructor(obj?: Partial<BuyerWallet>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class BalanceForBuyer {
  changes: number;
  closing: number;
  currency: string;
  date: string;

  constructor(obj?: Partial<BalanceForBuyer>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class BalanceForBuyerDetail {
  Amount: number;
  Description: string;
  Type: 'billed' | 'unbilled';

  constructor(obj?: Partial<BalanceForBuyerDetail>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
