export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export class ApiKey {
  apiKey: string;
  createdDateTime: number;
  identityUuid: string;
  orgUuid: string;
  status: ApiKeyStatus;

  constructor(obj?: Partial<ApiKey>) {
    Object.assign(this, obj);
  }
}
