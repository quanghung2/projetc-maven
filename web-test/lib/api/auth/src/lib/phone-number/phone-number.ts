export class SendCodeRequest {
  constructor(public mobileNumber: string, public type: string) {}
}

export class VerifyCodeRequest {
  constructor(public token: string, public mobileNumber: string, public code: string) {}
}

export class SendCodeResponse {
  token: string;
  sanitizedCode: string;
}
