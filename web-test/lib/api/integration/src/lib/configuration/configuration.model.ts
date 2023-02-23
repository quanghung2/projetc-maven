export interface Webhook {
  code: string;
  url: string;
  sandbox: boolean;
  signKey: string;
}

export interface CodeSample {
  code: string;
  sample: Object;
}

export interface WebhookLog {
  body: string;
  errorMsg: string;
  httpStatus: number;
  responseTime: number;
  time: number;
  url: string;
}
