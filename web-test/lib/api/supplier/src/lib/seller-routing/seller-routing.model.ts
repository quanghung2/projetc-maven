import { Supplier } from '../supplier/supplier.model';

export enum SellerRoutingType {
  CALL_OUTGOING = 'CALL_OUTGOING',
  CALL_INCOMING = 'CALL_INCOMING',
  FAX_OUTGOING = 'FAX_OUTGOING',
  FAX_INCOMING = 'FAX_INCOMING',
  SMS_OUTGOING = 'SMS_OUTGOING',
  SMS_INCOMING = 'SMS_INCOMING'
}
export class SellerRouting {
  id: string;
  domain: string;
  partnerUuid: string;
  visibilityType: string;
  orgUuid: string;
  orgName: string;
  supplier: Supplier;
  type: SellerRoutingType;
  createdDate: string;
  updatedDate: string;

  constructor(obj?: any) {
    if (obj) {
      obj.id = obj.orgUuid + obj.type;
      Object.assign(this, obj);
    }
  }
}

export interface CreateRoutingReq {
  orgUuid?: string;
  type: SellerRoutingType;
  supplierUuid: string;
}
