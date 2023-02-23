export class UpdateCreditLimitReq {
  buyerUuid: string;
  currency: string;
  increase: number;
  set: number;
  days: number;

  constructor(obj?: Partial<UpdateCreditLimitReq>) {
    Object.assign(this, obj);
  }
}
