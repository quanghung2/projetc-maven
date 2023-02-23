import { addDays } from 'date-fns';
import { ChatMessage } from '../../chat/chat-message.model';
import { EmailDraft } from '../../email/email-integration.model';
import {
  ConversationType,
  ConvoType,
  GroupType,
  MsgType,
  Privacy,
  RoleType,
  Status,
  UserType,
  ViewUIStateCommon
} from '../../enums.model';

const FULL_DAY = 24 * 60 * 60 * 1000;

declare let _: any;

export class ConversationMetadata {
  conversationId: string;
  conversationType: ConversationType;
  members: Member[] | string[] = [];
  lastMessage: Date;
  unreadCount: number;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface Member {
  chatUserUuid: string;
  conversationId?: string;
  identityUuid?: string;
  joinedAt?: Date;
  role: RoleType;
}

export class CustomerInfo {
  uuid: string;
  chatUuid: string; // chatUserUuid
  name: string;
  email: string;
  number: string;

  constructor(obj?: Partial<CustomerInfo>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ChatInfo {
  domain: string;
  domainTitle: string;
  country: string;
  city: string;
  userAgent: string;
}

export enum CustomerConversationType {
  assignedToMe = 'assignedToMe',
  unassigned = 'unassigned',
  assignedToOthers = 'assignedToOthers',
  archived = 'archived'
}

export interface GetConvoGroupMemberResp {
  conversationId: string;
  members: Member[];
}

export enum TXN_SECTION {
  ME = 'Assigned to me',
  UNASSIGNED = 'Unassigned',
  OTHERS = 'Assigned to others',
  ARCHIVED = 'Archived',
  CUSTOMER = 'Customer'
}

export class ConversationGroup {
  conversationGroupId: string;
  name: string;
  description: string;
  userStatus: string;
  memberStatus: string;
  avatar: string;
  whatsappLastReceivedDate: Date;
  txnSection: TXN_SECTION;

  type: GroupType;
  privacy: Privacy;
  status: Status;
  createdBy: string;
  archivedBy: string; // identity Uuid
  createdAt: Date;
  unreadCount: number;
  mentionCount: number;
  lastMessage: string;
  lastMsg: ChatMessage;
  lastMsgDisplay: string;
  isStarred: boolean;
  conversations: ConversationMetadata[];
  inboxChannelUuid: string;
  firstEmailRecipient: string;
  snoozeAt: string;
  snoozeBy: string;
  replyTime: Date;
  emailInboxUuid: string;
  draft: EmailDraft;
  customerInfo: CustomerInfo;
  chatInfo: ChatInfo;

  // client generate for direct chat
  meUuid: string; // chatUser
  snoozeFrom: number;

  // UI field
  messages: ChatMessage[];
  icon: string;

  get id() {
    return this.conversationGroupId;
  }

  constructor(obj?: Partial<ConversationGroup>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.customerInfo) {
        this.customerInfo = new CustomerInfo(obj.customerInfo);
      }
      this.adaptLastMsgDisplay();
    }
  }

  withMeUuid(meUuid: string) {
    this.meUuid = meUuid;
    return this;
  }

  adaptLastMsgDisplay() {
    if (this.lastMsg) {
      this.lastMsgDisplay =
        this.lastMsg.mt === MsgType.system || this.lastMsg.mt === MsgType.message
          ? this.lastMsg.body.text
          : this.lastMsg.mt === MsgType.email
          ? this.lastMsg.body.title
          : '';
    }

    // adapt members
    if (this.conversations) {
      this.conversations.forEach(x => {
        if (!x.members) {
          x.members = [];
        }
      });
    }
  }

  get displayName(): string {
    switch (this.type) {
      case GroupType.Customer:
      case GroupType.Email:
        return this.description;
      default:
        return this.name;
    }
  }

  get members(): Member[] {
    let members = [];

    if (this.conversations && this.conversations.length) {
      this.conversations.forEach(x => {
        if (x.members) {
          members = _.uniq(x.members, member => member.identityUuid);
        } else {
          x.members = [];
        }
      });
    }

    return members;
  }

  get isMember() {
    return !!this.meUuid && this.members.find(m => m.chatUserUuid === this.meUuid) != null;
  }

  get memLength() {
    return this.members.length;
  }

  get isUnread(): boolean {
    return this.unreadCount > 0 || this.mentionCount > 0;
  }

  get conversationIds(): string[] {
    return this.conversations.map(c => c.conversationId);
  }

  get publicConversationId(): string | undefined {
    // always have ono public convo
    if (!this.conversations) {
      return null;
    }

    const publicConvos = this.conversations
      .filter(c => c.conversationType === ConversationType.public)
      .map(c => c.conversationId);
    return publicConvos.length > 0 ? publicConvos[0] : this.conversationIds.length > 0 ? this.conversationIds[0] : null;
  }

  get isActive(): boolean {
    const last14day = addDays(new Date(), -14).valueOf();

    return new Date(this.lastMessage).valueOf() > last14day || new Date(this.createdAt).valueOf() > last14day;
  }

  get isOpen(): boolean {
    return this.status === Status.opened;
  }

  get isArchived(): boolean {
    return this.status === Status.archived || !!this.archivedBy;
  }

  get isCustomer(): boolean {
    return this.type === GroupType.Customer;
  }

  get isEmail(): boolean {
    return this.type === GroupType.Email;
  }

  get hasAvatar(): boolean {
    return this.avatar && this.avatar.indexOf('http') >= 0;
  }

  get canReplyMessage() {
    return (
      this.type !== GroupType.WhatsApp ||
      new Date().getTime() - new Date(this.whatsappLastReceivedDate).getTime() < FULL_DAY
    );
  }

  get convoType(): ConvoType {
    return this.type === GroupType.Email
      ? ConvoType.email
      : this.type === GroupType.Customer
      ? ConvoType.customer
      : ConvoType.whatsapp;
  }

  get displayConvoType(): string {
    return this.type === GroupType.Email ? 'Email' : 'Customer';
  }

  get userType(): UserType {
    return this.type === GroupType.Customer ||
      this.type === GroupType.WhatsApp ||
      this.type === GroupType.SMS ||
      this.type === GroupType.Email
      ? UserType.Agent
      : UserType.TeamMember;
  }

  containConversation(conversationId: string): boolean {
    return this.conversations && this.conversations.findIndex(x => x.conversationId === conversationId) >= 0;
  }

  containConversationGroup(conversationGroupId: string): boolean {
    return this.conversationGroupId && this.conversationGroupId === conversationGroupId;
  }

  equals(info: ConversationGroup): boolean {
    return info != null && this.conversationGroupId === info.conversationGroupId;
  }

  isAssignedTo(identityUuid: string): boolean {
    return (
      this.isOpen &&
      this.conversations != null &&
      this.conversations.findIndex(
        x =>
          x.conversationType === ConversationType.public &&
          x.members != null &&
          x.members.findIndex(y => y.identityUuid === identityUuid && y.role === RoleType.member) >= 0
      ) >= 0
    );
  }

  isUnassigned(): boolean {
    return (
      this.isOpen &&
      this.conversations != null &&
      this.conversations.findIndex(
        x =>
          x.conversationType === ConversationType.public &&
          x.members != null &&
          x.members.findIndex(y => y.role === RoleType.member) < 0
      ) >= 0
    );
  }

  get isEmailAssignedToMe(): boolean {
    return (
      this.isEmail &&
      this.isOpen &&
      !this.snoozeAt &&
      this.conversations.findIndex(
        x =>
          x.members != null &&
          x.members.findIndex(y => y.chatUserUuid === this.meUuid && y.role === RoleType.member) >= 0
      ) >= 0
    );
  }

  get isFollowingConversationByMe(): boolean {
    return (
      this.isEmail &&
      this.isOpen &&
      !this.snoozeAt &&
      this.conversations.findIndex(
        x =>
          x.conversationType === ConversationType.public &&
          x.members &&
          x.members.findIndex(y => y.chatUserUuid === this.meUuid && y.role === RoleType.followed) >= 0
      ) >= 0
    );
  }

  isSnoozeConversationBelongToAgent(identityUUId: string): boolean {
    return (
      this.isEmail &&
      this.isOpen &&
      this.snoozeAt &&
      this.snoozeFrom &&
      ((identityUUId && this.snoozeBy === identityUUId) || !identityUUId)
    );
  }

  isEmailConversationHasDraft(identityUuid: string) {
    return this.isEmail && this.status !== Status.archived && this.draft && this.draft.createdBy === identityUuid;
  }

  isEmailUnassignedBelongToInbox(inboxUuid: string): boolean {
    return (
      this.isOpen &&
      this.isEmail &&
      this.emailInboxUuid === inboxUuid &&
      this.conversations != null &&
      this.conversations.findIndex(
        x =>
          x.conversationType === ConversationType.public &&
          x.members != null &&
          x.members.findIndex(y => y.role === RoleType.member) < 0
      ) >= 0
    );
  }

  isEmailBelongToInbox(inboxUuid: string): boolean {
    return this.isOpen && this.isEmail && this.emailInboxUuid === inboxUuid;
  }

  isEmailAssignedToTeammates(chatUserUuid: string): boolean {
    return (
      this.isOpen &&
      this.isEmail &&
      this.conversations != null &&
      this.conversations.findIndex(
        x =>
          x.conversationType === ConversationType.public &&
          x.members != null &&
          x.members.findIndex(y =>
            chatUserUuid ? y.chatUserUuid === chatUserUuid && y.role === RoleType.member : y.role === RoleType.member
          ) >= 0
      ) >= 0
    );
  }

  isMemberOfConversation(): boolean {
    return (
      this.members.find(
        x => x.chatUserUuid === this.meUuid && (x.role === RoleType.member || x.role === RoleType.owner)
      ) != null
    );
  }
}

export class ConversationGroupReq {
  name: string;
  description: string;
  privacy: Privacy; // private/ public only
  type: GroupType;
  status: Status;
  conversations: ConversationReq[] = [];
}

export class ConversationReq {
  role: string;
  members: string[];
  conversationType: ConversationType;
}

export interface ConversationGroupUI extends ViewUIStateCommon {
  conversationGroupId?: string; // id entity

  // txn
  joined?: boolean; // to read history msg
}

export interface InboxEmailPaging {
  loaded: boolean;
  page?: number; // 1
  perPage?: number; // 10,
}

export const ConvoGroupStoreName = 'workspace_conversation_group';
