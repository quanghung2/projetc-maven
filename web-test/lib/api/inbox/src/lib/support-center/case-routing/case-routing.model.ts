export class CaseRouting {
  id: string;
  inboxUuid: string;
  typeIds: string[];
  productIds: string[];
  sourceOrgUuids: string[];
  sourceDomainUuids: string[];
  default: boolean; // if true cannot remove

  constructor(obj: Partial<CaseRouting>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayDomain() {
    return this.sourceDomainUuids?.join(', ');
  }
}

export interface CreateUpdateRoutingRuleReq {
  typeIds: string[];
  productIds: string[];
  sourceOrgUuids: string[];
  sourceDomainUuids: string[];
  inboxUuid: string;
}
