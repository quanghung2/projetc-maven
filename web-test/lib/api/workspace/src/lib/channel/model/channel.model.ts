import { Observable } from 'rxjs';
import { ChatMessage } from '../../chat/chat-message.model';
import { ConvoType, Privacy, Status, UserType } from '../../enums.model';
import { ChannelType, NameChannelPersonal } from '../model/enum-channel.model';

// only support : direct and group
export class Channel {
  id: string;
  updatedAt: Date;
  createdAt: Date;
  archivedAt: Date;
  archivedBy: string;
  createdBy: string;
  name: string;
  description: string;
  privacy: Privacy;
  type: ChannelType;
  status: Status;
  lastMessage: ChatMessage;
  lastSeenMillis: number;
  participants: IParticipant[];
  unreadCount: number;
  mentionCount: number;

  // client UI
  meUuid: string; // chatUser
  directChatUsers: DirectChatUser = <DirectChatUser>{};
  isDraft$: Observable<boolean>;
  isStarred: boolean;
  icon: string;

  constructor(obj?: Partial<Channel>) {
    if (obj) {
      Object.assign(this, obj);

      if (['group', 'gc'].includes(obj?.type)) {
        this.type = ChannelType.gc;
      } else if (['direct', 'dm'].includes(obj?.type)) {
        this.type = ChannelType.dm;
      } else if (['PERSONAL', 'personal'].includes(obj?.type)) {
        this.type = ChannelType.PERSONAL;
      }

      if (!obj.unreadCount) {
        this.unreadCount = 0;
      }

      if (!obj.mentionCount) {
        this.mentionCount = 0;
      }

      if (obj?.lastMessage) {
        this.lastMessage = new ChatMessage(obj.lastMessage);
      }

      if (this.unreadCount === 0 && obj?.lastSeenMillis) {
        this.lastSeenMillis = null;
      }

      // set icon
      this.setIconChannel();
    }
  }

  withMeUuid(meUuid: string) {
    this.meUuid = meUuid;
    if (!!meUuid && this.type === ChannelType.dm) {
      // because participant only 2 user (me and you) in direct chat
      this.directChatUsers = <DirectChatUser>{
        meUuid: meUuid,
        otherUuid:
          this.participants?.length === 1
            ? meUuid
            : this.participants[0].userID === meUuid
            ? this.participants[1].userID
            : this.participants[0].userID
      };
    }
    return this;
  }

  // filter orther public channel
  get isMyChannel() {
    return (
      this.type === ChannelType.dm || (!!this.participants && this.participants?.some(x => x.userID === this.meUuid))
    );
  }

  get displayName(): string {
    switch (this.type) {
      case ChannelType.dm:
        return this.directChatUsers?.otherUuid;
      case ChannelType.PERSONAL:
        return this.name[0].toUpperCase() + this.name.slice(1);
      default:
        // because group only id&name property,no type property
        return this.name;
    }
  }

  get isOpen(): boolean {
    return !this.archivedAt;
  }

  get isGroupChat() {
    return this.type === ChannelType.gc;
  }

  get isPersonalChat() {
    return this.type === ChannelType.PERSONAL;
  }

  get isPersonalBookmark() {
    return this.type === ChannelType.PERSONAL && this.name === NameChannelPersonal.BOOKMARKS;
  }

  get isMember() {
    return !!this.meUuid && this.participants?.find(m => m.userID === this.meUuid) != null;
  }

  get memLength() {
    return this.participants?.length || 0;
  }

  get isUnread(): boolean {
    return this.unreadCount > 0 || this.mentionCount > 0;
  }

  get isArchived(): boolean {
    return !!this.archivedAt || !!this.archivedBy;
  }

  get isGeneral(): boolean {
    return this.type === ChannelType.gc && this.name === 'general';
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

  get convoType() {
    return this.type === ChannelType.dm ? ConvoType.direct : ConvoType.groupchat;
  }

  get userType() {
    return UserType.TeamMember;
  }

  private setIconChannel() {
    if (this.type === ChannelType.PERSONAL) {
      this.setIconForPersonalChannel();
    } else if (this.type === ChannelType.gc) {
      if (this.privacy === Privacy.private) {
        this.icon = 'lock';
      } else {
        // this.icon = '#';
        this.icon = 'tag';
      }
    } else if (this.type === ChannelType.dm) {
      this.icon = 'lens';
    }
  }

  private setIconForPersonalChannel() {
    switch (this.name) {
      case NameChannelPersonal.BOOKMARKS:
        this.icon = 'bookmark';
        break;
      default:
        this.icon = 'person';
        break;
    }
  }
}

export interface ChannelPersonalResponse {
  channels: {
    [key: string]: {
      details: Partial<Channel>;
    };
  };
}

export interface IParticipant {
  userID: string;
  role: string;
}

export interface DirectChatUser {
  meUuid: string; // chatUser
  otherUuid: string; // chatUser
}

export interface CreateConvoGroupReq {
  name: string;
  description: string;
  privacy: Privacy;
  type: ChannelType | string;
  participants: string[]; // chatUser
}

// only 1 property
export interface UpdateChannelReq {
  name: string;
  description: string;
  add: string[];
  del: string[];
}

export interface RecentChannel {
  id: string;
  date: number;
}

// if the original message changed, calling the copy API again with the same payload to update the cloned message
export interface CopyMessageRequest {
  srcMessage: {
    convo: string;
    id: string;
    ct: string;
  };
  dstConvoId: string;
  options?: {
    shouldDeduplicate?: boolean; // must be true for bookmark channel
  };
}

export const ChatChannelStoreName = 'chat_channel';
