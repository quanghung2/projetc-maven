import { GroupType, Privacy } from '../enums.model';
import { BaseChatUser } from '../user/user.model';

export class Integration extends BaseChatUser {
  msChatUuid: string;
  status: IntegrationStatus;
  conversations: IntegrationConfig[] = [];
  isBot: boolean;

  get userUuid() {
    return this.msChatUuid;
  }

  get displayName() {
    return this.name;
  }

  get photoUrlOrDefault() {
    return this.hasPhoto ? this.photoUrl : 'assets/icons/bot_avatar.png';
  }

  get hasPhoto() {
    return !!this.photoUrl && this.photoUrl.indexOf('http') > -1;
  }

  get isOnline() {
    return true;
  }

  constructor(obj?: Partial<Integration>) {
    super();
    if (obj) {
      Object.assign(this, obj);
      if (obj.conversations && obj.conversations.length) {
        this.conversations = obj.conversations.map(i => new IntegrationConfig(i));
      }
      if (!obj.isBot) {
        this.isBot = true;
      }
    }
  }
}

export class IntegrationConfig {
  conversationGroupId: string;
  name: string;
  privacy: Privacy;
  groupType: GroupType;
  subChannels: string[] = [];

  constructor(obj?: Partial<IntegrationConfig>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum IntegrationStatus {
  Active = 'active',
  Deleted = 'deleted'
}
