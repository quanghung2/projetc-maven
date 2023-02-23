export interface IdentityCallerId {
  number: string[];
}

export enum CallerIdACK {
  success = 'success',
  failure = 'failure'
}

export interface CallerIdResp {
  ack: string; // for fun. only return `success` when http status == 200. Confirmed by MinhMinh
  number: string[];
}

export interface AddCallerIdRequest {
  number: string;
  token: string;
}
