export class Linkage {
  id: string;
  sellerUuid: string;
  buyerUuid: string;
  defaultCurrency: string;
  type: string;
  createdDate: number;

  constructor(obj?: Partial<Linkage>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
