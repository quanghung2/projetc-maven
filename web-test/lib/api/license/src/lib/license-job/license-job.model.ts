export interface GetCreateBulkExtensionJobReq {
  buyerUuid: string;
  statuses: JobStatuses;
  page: string;
  size: string;
}

export enum JobStatuses {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface CreateBulkExtensionJobResp {
  batchUuid: string;
}

export interface JobDetailResp {
  addons: string[];
  batchUuid: string;
  createdAt: string;
  extKey: string;
  identityUuid: string;
  number: number;
  status: JobStatuses;
  updatedAt: string;
}

export interface JobResp {
  batchUuid: string;
  buyerUuid: string;
  numOfFailed: number;
  numOfPending: number;
  numOfSuccess: number;
}
