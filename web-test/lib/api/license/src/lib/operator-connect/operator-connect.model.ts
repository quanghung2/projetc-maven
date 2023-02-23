export class OperatorConnectNumbers {
  number: string;
  info: InfoNumber;
  identityUuid: string;
  extKey?: string;
  extLabel?: string;
  status?: 'failed' | 'uploaded' | null;
  errorMessage?: string;

  constructor(obj?: Partial<OperatorConnectNumbers>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface GetOperatorConnectNumbersReq {
  sort?: string;
  fetchType?: string;
  keyword?: string;
  selected?: boolean;
}

export interface InfoNumber {
  assignedAt: number;
  number: string;
  sku: string;
  uploadedAt?: number;
  uploadStatus: 'notUploaded' | 'uploaded' | 'failed' | null;
}

export enum FetchTypeNumber {
  fetchAll = 'fetchAll',
  fetchUploaded = 'fetchUploaded',
  fetchNotUploaded = 'fetchNotUploaded',
  fetchFailedUploaded = 'fetchFailedUploaded'
}
