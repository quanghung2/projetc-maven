export class SellerWallet {
  walletRef: string;
  sellerUuid: string;
  currency: string;
  postpaid: boolean;
  unbilled: number;
  billed: number;
  balance: number;
  reserved: number;
  creditLimit: number;
  liability: number;
  usableCredit: number;

  constructor(obj?: Partial<SellerWallet>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export function createSellerWalletId(sellerUuid, currency) {
  return `${sellerUuid}_${currency};`;
}
