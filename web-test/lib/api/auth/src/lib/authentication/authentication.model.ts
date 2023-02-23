export interface LoginRequest {
  trustedBrowser?: string;
  credential?: string;
  password: string;
  tfaMethod?: string;
  fromDesktop?: boolean;
}

export class LoginResponse {
  sessionToken: string;
  loginId: string;
  seriesId: string;
  otpId: string;
  sanitizedCode: string;
  email: string;
  domain: string;
  portalDomain: string;
  identityUuid: string;
  loginSession: string;
  trustedBrowserUuid: string;
  otherDomains: string[] = [];
  type: string;

  get needVerifyOPT() {
    return !!this.loginSession;
  }

  get need2UpdateEmailFirst() {
    return !this.email;
  }

  constructor(obj?: Partial<LoginResponse>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface RefreshTokenReq {
  loginId: string;
  seriesId: string;
  domain: string;
}

export interface Login2FaRequest {
  loginSession: string;
  tfaSession: string;
  trustBrowser: boolean;
  rememberMe?: boolean;
}

export class LoginSession {
  userAgent: string;
  os: string;
  device: string;
  browser: string;
  country: string;
  ipAddress: string;
  datetime: number;
  successful: boolean;
  failureCause?: string;
  durationMillis?: number;

  constructor(obj?: Partial<LoginSession>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get location(): string {
    return `${this.country} (${this.ipAddress})`;
  }

  get deviceDisplay(): string {
    if (this.device === 'Other') {
      return 'Browser';
    }
    return this.device;
  }

  get statusLogin(): string {
    return this.successful ? 'Success' : 'Failed';
  }

  get duration(): string {
    return this.durationMillis ? `${Math.floor(this.durationMillis / 1000)}s` : '-';
  }
}

export class LoginSessionResponse {
  items: LoginSession[] = [];
  hasOtherSessions: boolean;
}

export interface LogoutRequest {
  loginId?: string;
  seriesId?: string;
  others?: boolean;
}

export interface AddEmailRequest {
  email: string;
}

export enum ResetPasswordType {
  reset = 'reset',
  verify = 'verify',
  activate = 'activate'
}

export class VerifyEmail {
  context: string;
  token: string;
  email: string;
  domain: string;

  constructor(obj?: Partial<VerifyEmail>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface ResetPasswordRequest {
  domain: string;
  email: string;
}

export interface CreateNewPasswordRequest {
  domain: string;
  password: string;
  token: string;
  type: string;
}

export class EmailBilling {
  email: string;
  token: string;
  loading: boolean;

  constructor(obj?: Partial<EmailBilling>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Address {
  block: string;
  building: string;
  country: string;
  contryDisplay: string; //add to show
  floor: string;
  postal: string;
  street: string;
  unit: string;

  constructor(obj?: Partial<Address>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayStreet() {
    return `${this.block} ${this.street} ${this.unit} #${this.floor}`;
  }

  get postalSG() {
    return `${this.contryDisplay} ${this.postal}`;
  }
}

export interface PersonReference {
  idno: string;
  nationality: string;
  'person-name': string;
}

export interface Appointment {
  'appointment-date': string;
  category: string;
  code: string;
  'position-desc': string;
  'person-reference': PersonReference;
}

export class Entity {
  address: Address;
  name: string;
  uen: string;
  appointments: Appointment[];

  constructor(obj?: Partial<Entity>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Person {
  email: string;
  mobileNumber: string;
  name: string;
  uinfin: string;
  employer: string;
  occupation: string;

  constructor(obj?: Partial<Person>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class MyInfo {
  entity: Entity;
  person: Person;
  createdAt: number;

  constructor(obj?: Partial<MyInfo>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum VerifyType {
  SingPass = 'SingPass',
  CorpPass = 'CorpPass'
}

export class AuthInfo {
  appId: string;
  domain: string;
  sessionToken: string;
  name: string;
  orgUuid: string;

  constructor(obj?) {
    Object.assign(this, obj);
  }
}
