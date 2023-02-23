export class DomainLiability {
  currentCredit: number;
  currentLiability: number;
  isLiable: boolean;
  maxAllowed: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
