export interface SecretApiKey {
  id: number;
  secretPrefix: string;
  identityUuid: string;
  label: string;
  concurrency: number;
}

export interface CreateKeyResponse {
  secret: string;
}

export interface DeveloperLicense {
  subUuid: string;
  assignedApiKeyId: number;
}

export interface CreateApiKeyReq {
  name: string; //limit 100 utf chars
  developerLicence: string;
}

export class APIKey {
  id: number;
  name: string;
  apiKey: string;
  created: string;

  constructor(obj?: Partial<APIKey>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayApiKey(): string {
    return (
      this.apiKey
        ?.split('')
        ?.map(c => '●')
        ?.join('') || ''
    );
  }
}

export interface UpdateOrResetApiKeyReq {
  name: string; // null to retain previous config
  regenApiKey: boolean;
}

export interface UpdateOrResetApiKeyResp {
  apiKey: string;
}

export interface IpAddress {
  ipAddress: string;
}

export interface ApiLog {
  time: number;
  ipAddress: string;
  method: string;
  path: string;
  queryString: string;
  body: string;
  response: string;
  httpStatus: string;
}
