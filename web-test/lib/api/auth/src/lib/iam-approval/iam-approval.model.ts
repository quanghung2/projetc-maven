import { Identity, Organization } from '@b3networks/api/auth';
import { IAMGrantedPermission } from '../iam/iam.model';

export interface CreateApprovalReq {
  orgUuid: string;
  iamPolicies: IAMGrantedPermission[];
  requesterNote?: string;
  documentKeys?: string[];
  requesterData?: string;
}

export enum ApprovalStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

export class ApprovalResp {
  approvedDateTime: number;
  approver: Identity;
  approverNote: string;
  createdDateTime: number;
  documentKeys: string[];
  iamPolicies: IAMGrantedPermission[];
  id: number;
  lastUpdatedDateTime: number;
  organization: Organization;
  requester: Identity;
  requesterData: string;
  requesterNote: string;
  status: ApprovalStatus;

  constructor(obj?: Partial<ApprovalResp>) {
    Object.assign(this, obj);
  }
}
