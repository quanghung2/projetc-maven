export class Supplier {
  id: string;
  name: string;
  stack: string;
  plan: string;
  visibilityType: string;
  partnerUuid: string;
  uuid: string;
  createdDate: string;
  updatedDate: string;
  fallbackB3Skus: boolean;

  constructor(obj?: Partial<Supplier>) {
    if (obj) {
      obj.visibilityType = 'ALL';
      obj.id = obj.uuid;
      Object.assign(this, obj);
    }
  }
}

export interface Seller {
  domain: string;
  uuid: string;
  defaultSupplier: SupplierSeller;
  supportedSuppliers: SupplierSeller[];
  fallbackSupplier: SupplierSeller;
}

export interface SupplierSeller {
  supplierUuid: string;
  name: string;
}

export interface Route {
  primary: string;
  secondary: string;
  load: number;
}

export interface Plan {
  name: string;
  action: string;
  routes: Route;
}

export interface CreatePlanReq {
  stack: string;
  name: string;
  primary: string;
  secondary: string;
}

export interface UpdateMappingRefReq {
  supplierUuid: string;
  addSkus: string[];
  removeSkus: string[];
}

export interface SetDefaultSupplierForAdminReq {
  defaultSupplierUuid: string;
  supplierUuids: string[];
}
