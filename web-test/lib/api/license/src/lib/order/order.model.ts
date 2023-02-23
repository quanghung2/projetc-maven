import { BillingCycle } from '@b3networks/api/salemodel';
import { ID } from '@datorama/akita';

export enum OrderStatus {
  pending = 'PENDING',
  approved = 'APPROVED',
  rejected = 'REJECTED'
}

export interface OrderBundleItem {
  productId: string;
  sku: string;
  saleModelCode: BillingCycle;
  quantity: number;
  numberSku: string | null;
  numberProduct?: string;
}

export interface OrderBundle {
  id: number;
  quantity: number;
  items: OrderBundleItem[];
}

export interface OrderNumber {
  licenseSku: string;
  numberSku: string;
  number: string;
}

export enum SingtelAction {
  provision_v2 = 'provision_v2',
  multiline_voice_provision = 'multiline_voice_provision'
}

export interface SingtelInfo {
  requestId: ID | null;
  brn: string;
  action: SingtelAction;
  service: 'api' | 'bizphone' | 'flow' | 'msteam' | 'voicecallrecording' | 'multiline' | 'virtualline' | 'wallboard';
  simType: 'physical' | 'virtual';
}

export class Order {
  id: number;
  orgUuid: string;
  bundles: OrderBundle[];
  numbers: OrderNumber[] | null;
  singtelInfo: SingtelInfo;
  excludeBase: boolean;
  approvedBy: string | null;
  approvedDate: number | null;
  remark: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  fileInfos: FileInfo[];
  billingStartDate: string;
  contractNumber: string;

  constructor(obj?: Partial<Order>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get readonly() {
    return [OrderStatus.approved, OrderStatus.rejected].includes(this.status);
  }

  get editable() {
    return this.status === OrderStatus.pending;
  }

  get canApprove() {
    return this.status === OrderStatus.pending;
  }

  get canDelete() {
    return [OrderStatus.pending, OrderStatus.rejected].includes(this.status);
  }
}

export function createOrder(params: Partial<Order>) {
  return {} as Order;
}

export interface GetOrderReq {
  buyerUuid?: string;
  statuses?: OrderStatus[];
}

export interface CreateOrderReq {
  orgUuid: string;
  excludeBase: boolean;
  bundles: OrderBundle[];
  numbers: OrderNumber[];
  singtelInfo: SingtelInfo;
  remark: string;
  fileInfos?: FileInfo[];
  billingStartDate?: string;
  contractNumber?: string;
}

export interface FileInfo {
  s3Key: string;
  uploadedAt: string;
  name?: string;
}
