import { RoleUserHyperspace } from '../channel-hyperspace/model/channel-hyperspace-request.model';
import { SystemMsgType } from '../enums.model';
import { IdentityStatus, OrganizationMemberStatus, UserRole } from '../user/user.model';

export interface SystemMessageData {
  text?: string;
  type: SystemMsgType;
  data?: any | JoinLeaveFollowedData | UpdateChannelMetaData | MoveEmailConversation | SnoozeEmailConversation;

  // hyperspace system
  convoUpdateUsers?: JoinLeaveFollowedData;
  convoUpdateMetadata?: UpdateChannelHyperspaceMetaData;
  hyperspaceUpdateUsers?: HyperspaceUpdateUsers;

  // newUser system
  newUser: NewUserData;
}

export interface SnoozeEmailConversation {
  snoozeFrom: number;
  snoozeAt: string;
}

// SystemMsgType.update
export interface UpdateChannelMetaData {
  metadata: {
    id: string;
    name: string;
    description: string;
  };
}

// SystemMsgTyp.convoUpdateUsers
export interface UpdateChannelHyperspaceMetaData {
  description: string;
}

export interface HyperspaceUpdateUsers {
  joined?: JoinedLeftHyperspaceUpdateUsers[];
  left?: JoinedLeftHyperspaceUpdateUsers[];
}

export interface JoinedLeftHyperspaceUpdateUsers {
  ns: string;
  id: string; // chatUser
  role?: 'member' | 'admin';
}

export interface MoveEmailConversation {
  emailInboxUuid: string;
}

export class JoinLeaveFollowedData {
  join: string[] = [];
  leave: string[] = [];
  followed: string[] = [];

  // for hyper
  joined: JoinLeaveInputHyperspace[] = [];
  left: JoinLeaveInputHyperspace[] = [];

  constructor(obj?: Partial<JoinLeaveFollowedData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface JoinLeaveInputHyperspace {
  id: string; // chatUserid
  ns: string; // orgUuid
  role?: RoleUserHyperspace;
}

export interface NewUserData {
  orgUuid: string;
  chatUserId: string;
  memberUuid: string; // identityUuid
  memberStatus: OrganizationMemberStatus;
  role: UserRole;
  licenseEnabled: boolean;
  givenName: string;
  familyName: string;
  displayName: string;
  identityStatus: IdentityStatus;
}
