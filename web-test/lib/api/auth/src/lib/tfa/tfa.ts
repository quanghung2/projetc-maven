export interface TfaInfo {
  tfaEnabled: boolean;
  recoveryKey: string;
  activationDate: number;
  totpActivated: boolean;
}

export class TFAIntentType {
  static LOGIN = 'LOGIN';
  static ENABLE_TFA = 'ENABLE_TFA';
  static DISABLE_TFA = 'DISABLE_TFA';
  static REFRESH_RECOVERY_KEY = 'REFRESH_RECOVERY_KEY';
}

export class SendOtpCodeRequest {
  constructor(public intent: TFAIntentType) {}
}

export class SendOtpCodeResponse {
  public sanitizedCode: string;
  public otpId: string;
}

export class Toggle2FaRequest {
  constructor(public tfaSession: string) {}
}

export class Toggle2FaResponse {
  recoveryKey: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Verify2FaType {
  static system = 'system_generated';
  static recover = 'recovery_key';
  static totp = 'totp';
}

export class Verify2FaRequest {
  fromMobile: boolean;
  domain: string;
  otpId: string;
  otpCode: string;
  recoveryKey: string;
  type: Verify2FaType;

  constructor(obj?: Partial<Verify2FaRequest>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Verify2FaResponse {
  tfaSession: string;
}

export class RefreshRecoveryKeyRequest {
  constructor(public tfaSession: string) {}
}

export class RefreshRecoveryKeyResponse {
  public recoveryKey: string;
}

export class TotpResponse {
  public uri: string;
  public secret: string;
}

export class TotpRequest {
  constructor(public secret: string, public code: string) {}
}
