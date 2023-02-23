import { Observable } from 'rxjs';
import { DirectChatUser, IParticipant } from '../../channel/model/channel.model';
import { ChannelType } from '../../channel/model/enum-channel.model';
import { ChatMessage } from '../../chat/chat-message.model';
import { ConvoType, Privacy, UserType } from '../../enums.model';

export interface SeenStatus {
  lastSeenMillis: string;
  unreadCount: string | number;
  mentionCount: string | number;
}

export interface NamespacesHyper {
  id: string; // orgUuid;
  users: { id: string; role: 'member' | 'admin' }[];
}

export class ChannelHyperspace {
  // not use, mapping to use
  private namespaces: NamespacesHyper[];

  // BE
  hyperspaceId: string;
  id: string;
  name: string;
  description: string;
  privacy: Privacy; // now support public channel
  type: ChannelType; // only gc
  createdAt: Date;
  createdBy: string;
  archivedAt: Date;
  archivedBy: string;

  // mapping
  participantCurrentOrg: IParticipant[] = [];
  participantOtherOrg: IParticipant[] = [];

  // client UI
  meUuid: string; // chatUser
  directChatUsers: DirectChatUser = <DirectChatUser>{};
  isDraft$: Observable<boolean>;
  unreadCount: number;
  mentionCount: number;
  lastSeenMillis: number;
  lastMessage: ChatMessage;
  isStarred: boolean;
  icon: string;

  constructor(obj?: Partial<ChannelHyperspace>) {
    if (obj) {
      Object.assign(this, obj);

      if (['group', 'gc'].includes(obj?.type)) {
        this.type = ChannelType.gc;
      } else if (['direct', 'dm'].includes(obj?.type)) {
        this.type = ChannelType.dm;
      }

      if (!obj.unreadCount) {
        this.unreadCount = 0;
      }

      if (!obj.mentionCount) {
        this.mentionCount = 0;
      }

      if (!obj.lastSeenMillis) {
        this.lastSeenMillis = 0;
      }

      if (obj.type === ChannelType.gc) {
        this.icon = 'share';
      } else if (obj.type === ChannelType.dm) {
        this.icon = 'lens';
      }
    }
  }

  mappingModel(mapping: MappingHyperData) {
    if (mapping.currentOrg) {
      this.namespaces?.forEach(namespace => {
        if (namespace.id === mapping.currentOrg) {
          this.participantCurrentOrg = namespace?.users?.map(u => <IParticipant>{ userID: u.id, role: u.role }) || [];
        } else {
          this.participantOtherOrg = namespace?.users?.map(u => <IParticipant>{ userID: u.id, role: u.role }) || [];
        }
      });
      delete this.namespaces;
    }
    this.meUuid = mapping?.meUuid;
    return this;
  }

  // filter orther public channel
  get isMyChannel() {
    return this.type === ChannelType.dm || this.isMember;
  }

  get allMembers() {
    return [...this.participantCurrentOrg, ...this.participantOtherOrg] || [];
  }

  get displayName(): string {
    switch (this.type) {
      case ChannelType.dm:
        return this.directChatUsers?.otherUuid;
      default:
        // because group only id&name property,no type property
        return this.name;
    }
  }

  get isGroupChat() {
    return this.type === ChannelType.gc;
  }

  get convoType() {
    return this.type === ChannelType.dm ? ConvoType.direct : ConvoType.groupchat;
  }

  get isMember() {
    return !!this.meUuid && this.participantCurrentOrg?.some(m => m.userID === this.meUuid);
  }

  get isUnread(): boolean {
    return this?.unreadCount > 0 || this?.mentionCount > 0;
  }

  get isOpen(): boolean {
    // return !this.archivedAt;
    return true;
  }

  get isArchived(): boolean {
    // return !!this.archivedAt || !!this.archivedBy;
    return false;
  }

  get displayConvoType(): string {
    return this.type === ChannelType.dm ? 'Member' : 'Team';
  }

  get displayDetailConvoType(): string {
    return this.type === ChannelType.dm ? 'Member' : 'Channel';
  }

  get isPublic() {
    return this.privacy === Privacy.public;
  }

  get userType() {
    return UserType.TeamMember;
  }
}

export interface MappingHyperData {
  meUuid: string; // chat userId
  currentOrg: string;
}

export const ChatChannelHyperspaceStoreName = 'chat_channel_hyperspace';
