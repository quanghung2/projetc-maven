import { IAMGrantedPermission } from '../iam/iam.model';

export class PolicyDocument {
  orgUuid: string; // added from client for storing
  version: string;
  createAt: string;
  updatedAt: string;
  policies: IAMGrantedPermission[] = [];

  constructor(obj?: Partial<PolicyDocument>) {
    if (obj) {
      Object.assign(this, obj);
      this.policies = this.policies?.map(p => new IAMGrantedPermission(p));
    } else {
      this.policies = [];
    }
  }

  withOrgUuid(orgUuid: string) {
    this.orgUuid = orgUuid;
    return this;
  }

  hasGrantedActionPermission(service, action: string) {
    return this.policies.some(p => p.isAllowedAction(service, action));
  }
}

export function createOrganizationPolicy() {
  return {} as PolicyDocument;
}
