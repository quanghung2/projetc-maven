export class Contract {
  contractNumber: string;
  end: number[];
  items: ContractItem[];
  status: ContractStatus;
  changeoverFrom: ContractChangeoverFrom;
  currency: string;

  constructor(obj?: Partial<Contract>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get statusLabel() {
    switch (this.status) {
      case ContractStatus.READY:
        return 'Ready';
      case ContractStatus.IN_PROGRESS:
        return 'In progress';
      default:
        return '';
    }
  }
}

export interface ContractItem {
  productId: string;
  sku: string;
  salemodel: string;
  quantityLimit: number;
  name: string;
  unitPriceTaxExcl: number;
  activeUse: number;
  taxRate: number;
}

export class ContractChangeoverFrom {
  contractNumber: string;
}

export enum ContractStatus {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS'
}
