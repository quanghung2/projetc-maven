import { Identity, IdentityStatus, MemberRole, UPPER_ADMIN_ROLES } from '../identity/identity';
import { PolicyDocument } from '../organization-policy/policty-document.model';

export enum MemberStatus {
  disabled = 'DISABLED',
  active = 'ACTIVE',
  pending = 'PENDING_ACTIVATION'
}

export enum MemberTitle {
  vip = 'VIP'
}

export class Member extends Identity {
  role: MemberRole;
  memberStatus: MemberStatus;
  // member policy
  policyDocument: PolicyDocument;

  //directory api
  name?: string;
  extensionKey?: string;
  extensionLabel?: string;

  constructor(obj?: Partial<Member>) {
    if (obj) {
      super(obj);
      Object.assign(this, obj);
    }
  }

  get isUpperAdmin(): boolean {
    return UPPER_ADMIN_ROLES.includes(this.role);
  }

  get isOwner(): boolean {
    return this.role === MemberRole.OWNER || this.role === MemberRole.SUPER_ADMIN;
  }

  get isRoleStartWithAVowel(): boolean {
    return this.isOwner || this.role === MemberRole.ADMIN;
  }

  get isDisabled() {
    return this.memberStatus === MemberStatus.disabled;
  }

  get displayStatus(): IdentityStatus | MemberStatus {
    if (this.isSuspended) {
      return IdentityStatus.suspended;
    }
    return this.memberStatus;
  }
}

export class IAMMember extends Member {
  manageSystem?: boolean;
  orgUuid?: string;
  reportsAccess?: boolean;
  countryCode?: string;
  identityUuid?: string;
  iamPolicy?: PolicyDocument | null;
  licenseEnabled?: boolean;
  handle?: string | null;
  permissions?: string[];

  constructor(obj?: Partial<IAMMember>) {
    if (obj) {
      super(obj);
      Object.assign(this, obj);
    }
  }
}

export interface GetIAMMemberReqParam {
  keyword?: string;
  sort?: SortMemberDirection;
}

export enum SortMemberDirection {
  ASC = 'member.identity.givenName,asc',
  DESC = 'member.identity.givenName,desc'
}

export interface AddMemberRequest {
  name: string;
  email: string;
  portalAccess: boolean;
  role: string;
  teamUuids?: string[];
}

export interface UpdateIAMReq {
  action: string;
  effect: string;
  service: string;
  resources: string[];
}

export class TriggerExportMember {
  jobId: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ExportMember {
  tempKey: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ImportMemberRequest {
  fileKey: string;
  createPin: boolean;
  teamUuids: string[];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class MemberPin {
  pin: string;
  createdDateTime: Date;
}

export class MemberUpdateRequest {
  role?: MemberRole;
  status?: MemberStatus;
  identityStatus?: IdentityStatus;
  title?: MemberTitle | string;
  username?: string;
  password?: string;
  name?: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class CreateCredentialRequest {
  email: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export interface GetMembersReq {
  orgUuid: string;
  filterByTeamUuid?: string;
  memberUuids?: string[];
  excludeTeamUuid?: string;
  excludeUuids?: string[];
  includeDisabledMembers?: boolean;
  keyword?: string;
  status?: string;
  sort?: string;
  filterByRoles?: MemberRole[];
  teamUuid?: string;
  excludeIamGroupUuid?: string;

  roles?: MemberRole[];
  filterExtension?: boolean;
  team?: string;
}

export interface ResendActivationEmailReq {
  memberUuids: string[];
}

export class PendingMember {
  id: number | null;
  member: Identity;
  email: string;
  role: string;
  expireAt: number;
  activatedAt: number | null;
  lastTriggeredAt: number | null;
  importUuid: string;

  constructor(obj?: Partial<PendingMember>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ImportMemberResp {
  invalidEmails: string[];
  total: number;

  constructor(obj?: Partial<ImportMemberResp>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get success() {
    return !this.invalidEmails;
  }

  get warning() {
    return this.invalidEmails && this.invalidEmails.length > 0 && this.invalidEmails.length < this.total;
  }

  get error() {
    return this.invalidEmails && this.invalidEmails.length > 0 && this.invalidEmails.length === this.total;
  }

  get message() {
    let message;
    if (this.success) {
      message = 'All members have been imported successfully';
    }
    if (this.warning) {
      message = `Partially successful upload <br>
      Invalid emails: ${this.invalidEmails.join(',')}`;
    }
    if (this.error) {
      message = 'Import file contains invalid emails';
    }

    return message;
  }
}

export interface SearchMemberIncludeTeam {
  keyword: string;
  filterByTeamUuids: string[];
  status?: string | 'ACTIVE';
}
