export class Wallet {
  walletUuid: string;
  orgUuid: string;
  currency: string;

  p2p: boolean;
  postpaid: boolean;
  balance: BalanceType;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      if ('balance' in obj) {
        this.balance = new BalanceType(obj['balance']);
      }
    }
  }
}

export class BalanceType {
  type: string; // pospaid | prepaid

  // prepaid data
  availableCredit: number; // positive = credit; includes amount reserved
  currentCredit: number; // positive = credit; excludes amount reserved
  creditLimit: number;
  usableCredit: number;

  // pospaid data
  outstandingBilled: number; // positive = outstanding. it's amount due
  outstandingUnbilled: number;
  unbilledCreditLimit: number;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  // For debt, credit limit is defined by (credit limit + billed if CR - unbilled - reserved)
  get availableForReservation() {
    return this.type === 'postpaid'
      ? this.unbilledCreditLimit - (this.outstandingBilled < 0 ? this.outstandingBilled : 0) - this.outstandingUnbilled
      : this.availableCredit;
  }
}
