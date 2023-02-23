import { Team } from '@b3networks/api/auth';
import { RequestDetailLeaves } from '@b3networks/api/leave';
import { randomRGBA } from '@b3networks/shared/common';

export enum OrganizationMemberStatus {
  DISABLED = 'DISABLED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_ACTIVATION = 'PENDING_ACTIVATION'
}

export enum IdentityStatus {
  DELETED = 'DELETED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum UserRole {
  owner = 'OWNER',
  admin = 'ADMIN',
  member = 'MEMBER'
}

export enum UserStatus {
  online = 'online',
  offline = 'offline',
  idle = 'idle'
}

export class UserStatusResponse {
  uuid: string;
  state: UserStatus;
  ts: number;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class BaseChatUser {
  uuid: string;
  orgUuid: string;
  name: string;
  photoUrl: string;
  createdBy: string;
  createdAt: Date;
}

export interface UserUI {
  uuid: string; // id entity
  loadedDetailFromAuth: boolean;
  loadedTeams: boolean;
}

export class User extends BaseChatUser {
  userUuid: string; // chat useruuid. Unique for each identity and org
  displayName: string;
  identityUuid: string;
  timezone: string;

  agentRole: string;
  handle: string;
  role: UserRole;
  email: string;
  memberStatus: string;
  mobileNumber: string;

  //ui
  isTemporary: boolean; // get all user v2
  status: UserStatus;
  latestStatusMillis = 0;
  isAgent: boolean;
  isBot: boolean; // addition property
  requestLeaveNow: RequestDetailLeaves;
  about: string; // api detail from auth
  teams: Team[];

  constructor(obj?: Partial<User>) {
    super();
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get photoUrlOrDefault() {
    return this.photoUrl && this.photoUrl.indexOf('http') > -1
      ? this.photoUrl
      : 'https://ui.b3networks.com/external/logo/default_org_icon.png';
  }

  get hasPhoto() {
    return !!this.photoUrl && this.photoUrl.indexOf('http') > -1;
  }

  get isActive(): boolean {
    return this.memberStatus === 'ACTIVE';
  }

  get isSupervisor(): boolean {
    return this.agentRole === 'supervisor';
  }

  get isOnline() {
    return this.status === UserStatus.online;
  }

  get avatarColor(): string {
    if (!this.photoUrl || this.photoUrl.indexOf('http') < 0) {
      return randomRGBA(this.identityUuid);
    }
    return this.photoUrlOrDefault;
  }

  get utcOffset(): string {
    return this.timezone ? this.timezone.substring(3, 8) : '+0800';
  }

  get displayTeams() {
    return this.teams?.map(x => x.name)?.join(', ') || '';
  }
}

export interface CallCenterAgent {
  displayName: string;
  email: string;
  identityUuid: string;
  photoUrl: string;
  role: UserRole;
}
