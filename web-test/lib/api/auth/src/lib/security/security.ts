export interface SecurityCompliance {
  isActive: boolean;
  tfaRequired: boolean;
  passwordUpdatePrompt: boolean;
  passwordDaysBeforeExpiry: number;
  passwordUpdateRequired: boolean;
}

export class PasswordPolicy {
  public expirationInDays: number;
  public passwordReusePreventionCount: number;
  public minimumLength: number;
  public maximumLength: number;
  public uppercaseRequired: boolean;
  public lowercaseRequired: boolean;
  public numberRequired: boolean;
  public nonAlphanumericRequired: boolean;

  public get passwordExpiration(): boolean {
    return this.expirationInDays > 0;
  }

  public set passwordExpiration(value: boolean) {
    if (value) {
      this.expirationInDays = 180;
    } else {
      this.expirationInDays = 0;
    }
  }

  public get preventPasswordReuse(): boolean {
    return this.passwordReusePreventionCount > 0;
  }

  public set preventPasswordReuse(value: boolean) {
    if (value) {
      this.passwordReusePreventionCount = 3;
    } else {
      this.passwordReusePreventionCount = 0;
    }
  }

  constructor(value?: Object) {
    if (value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}

export class SecurityPolicy {
  public passwordPolicy: PasswordPolicy = new PasswordPolicy({});
  public loginLockedAfterXAttempts: number;
  public tfaEnforced: boolean;
  public sessionExpiryTimeInHours: number;
  public deviceSessionExpiryTimeInHours: number;
  public mobileSessionExpiryTimeInHours: number;
  public desktopSessionExpiryTimeInHours: number;
  public preventConcurrentActiveWebSession: boolean;
  public allowedIPs: string[];
  public enabledManagedService: boolean;

  public get lockLogin(): boolean {
    return this.loginLockedAfterXAttempts > 0;
  }

  public set lockLogin(value: boolean) {
    if (value) {
      this.loginLockedAfterXAttempts = 3;
    } else {
      this.loginLockedAfterXAttempts = 0;
    }
  }

  constructor(value: Object) {
    if (value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          if (key === 'passwordPolicy') {
            this.passwordPolicy = new PasswordPolicy(value[key]);
          } else {
            this[key] = value[key];
          }
        }
      }
    }
  }
}

export class SecurityPolicyDetail {
  key: string;
  portal: string;
  securityPolicy: SecurityPolicy;

  constructor(obj?: Partial<SecurityPolicyDetail>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.securityPolicy) {
        this.securityPolicy = new SecurityPolicy(obj.securityPolicy);
      }
    }
  }
}
