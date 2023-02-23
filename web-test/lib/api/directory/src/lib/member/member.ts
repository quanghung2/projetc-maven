import { IdentityStatus, MemberRole, MemberStatus, UPPER_ADMIN_ROLES } from '@b3networks/api/auth';

export class DirectoryMember {
  memberUuid: string;
  username: string | null;
  email: string;
  mobileNumber: string;
  title: string | null;
  name: string;
  orgUuid: string;
  role: MemberRole;
  teamRole: MemberRole;
  identityStatus: IdentityStatus;
  memberStatus: MemberStatus;
  photoUrl: string | null;

  extensionKey: string | null;
  extensionLabel: string | null;

  constructor(obj?: Partial<DirectoryMember>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get directoryText() {
    return this.extensionLabel + (!!this.extensionKey ? ` (#${this.extensionKey})` : '');
  }

  get isSuspended() {
    return this.identityStatus === IdentityStatus.suspended;
  }

  get isUpperAdmin(): boolean {
    return UPPER_ADMIN_ROLES.includes(this.role);
  }

  get isOwner(): boolean {
    return this.role === MemberRole.OWNER || this.role === MemberRole.SUPER_ADMIN;
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

export interface GetDirectoryMembersReq {
  keyword?: string;
  filterExtension?: boolean;
  team?: string;
  status?: MemberStatus[];
  sort?: 'asc' | 'desc';
}
