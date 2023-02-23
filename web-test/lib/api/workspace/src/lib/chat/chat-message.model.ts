import { ResponseTxn } from '@b3networks/api/callcenter';
import { getBit, setBit } from '@b3networks/shared/common';
import { Channel } from '../channel/model/channel.model';
import { ConversationGroup } from '../conversation-group/model/conversation-group.model';
import { EmailMessageGeneral } from '../email/email-integration.model';
import { ConvoType, MsgType, PersistentFlag, SystemType, TransientFlag, UserType } from '../enums.model';
import { getTimeFromChatServer } from '../helper/time.service';
import { ChannelHyperspace } from './../channel-hyperspace/model/channel-hyperspace.model';
import { AttachmentMessageData, AttachmentMessageDataV2 } from './chat-message-attachment.model';
import { CaseMessageData } from './chat-message-case.model';
import { IMessBodyData } from './chat-message-imess.model';
import { InteractiveMessageData } from './chat-message-interactive.model';
import { SystemMessageData } from './chat-message-system.model';
import { TxnMessageData } from './chat-message-txn.model';
import { ChatTopic } from './chat-session.model';

export interface PreChatSurvey {
  name: string;
  email: string;
}

// preview message data
export interface PreviewMessageData {
  desc: string;
  icon: string;
  image: string;
  title: string;
  meta?: {
    height: number;
    size: number;
    width: number;
  };
}

export class MessageBody {
  text: string; // for searching on ES
  title: string; // for notification. if empty title equals text
  data:
    | any
    | string // string for pointer message.
    | PreviewMessageData
    | AttachmentMessageData
    | AttachmentMessageDataV2
    | InteractiveMessageData
    | SystemMessageData
    | CaseMessageData
    | EmailMessageGeneral
    | PreChatSurvey
    | ResponseTxn
    | IMessBodyData
    | TxnMessageData;

  constructor(obj?: Partial<MessageBody>) {
    if (obj) {
      Object.assign(this, obj);
      if (typeof obj['data'] === 'string' && !!obj['data']) {
        try {
          this.data = JSON.parse(obj['data']);
        } catch (error) {
          // TODO for pointer data
          this.data = obj['data'];
        }
      }
      if (this.text) {
        // progess text message
      }
    }
  }
}

export class Metadata {
  content: ChatMessage;
  editedAt: number;
  deletedAt: number;

  constructor(obj?: Partial<Metadata>) {
    if (obj) {
      Object.assign(this, obj);
      this.editedAt = +obj.editedAt || +obj['edited_at'] || undefined;
      this.deletedAt = +obj.deletedAt || +obj['deleted_at'] || undefined;
    }
  }
}

export class LinkedMessages {
  snapshots: ChatMessage[];
  srcId: string; // messsageId bookmarked
  replyTo: string; // messageId reply
  constructor(obj?: Partial<LinkedMessages>) {
    if (obj) {
      Object.assign(this, obj);
      this.snapshots = obj?.snapshots?.map(x => new ChatMessage(x)) || [];
    }
  }

  get messageBookmark() {
    return this.snapshots?.find(x => x.id === this.srcId);
  }

  get indexMessageBookmark() {
    return this.snapshots?.findIndex(x => x.id === this.srcId);
  }

  get messageReply() {
    return this.snapshots?.find(x => x.id === this.replyTo);
  }

  get indexMessageReply() {
    return this.snapshots?.findIndex(x => x.id === this.replyTo);
  }

  addMsgToSnapshots(msg: ChatMessage) {
    if (msg) {
      const index = this.snapshots.findIndex(x => x.id === msg.id);
      if (index === -1) {
        this.snapshots.push(msg);
      }
    }
    return this;
  }
}

export class ExtraData {
  linkedMessages: LinkedMessages;

  constructor(obj?: Partial<ExtraData>) {
    if (obj) {
      this.linkedMessages = new LinkedMessages(obj.linkedMessages);
    }
  }
}

export class ChatMessage {
  id: string; //message id return from chat server
  ts: number; // timestamp from server
  client_ts: number; // client timestamp
  convo: string; // conversation id (sub_conversation)
  hs: string; // hyperspaceId
  ns: string; // namespace hyperspace
  user: string; // chat userUuid
  metadata: Metadata; // edited flag
  extraData: ExtraData; // link message

  ut: UserType; // user type (agent, team_member, customer)
  ct: ConvoType; // conversation type (directchat, groupchat, customerchat)
  mt: MsgType; // message type (attachment, system, message, prechatsurvey)

  st: SystemType; // 'seen' this is use for notify that user already read this conversation
  body: MessageBody = new MessageBody();
  err: string;
  tf = 0; // transition flag readmore at https://b3networks.atlassian.net/browse/CHAT-124
  topics?: ChatTopic[]; // want to send msg for websockets are subscribed this topics
  pf: string | number; // persistent flag: on history + live msg

  // for id to hash, some action message don't have id
  get clientId(): string {
    return this.id || this.unixTsAndUser;
  }

  get unixTsAndUser(): string {
    return `${this.client_ts}_${this.user}`;
  }

  get hasMention(): boolean {
    return getBit(+this.tf, TransientFlag.IsMentioned);
  }

  get IsNotified(): boolean {
    return getBit(+this.tf, TransientFlag.IsNotified);
  }

  get isNoStore(): boolean {
    return getBit(+this.tf, TransientFlag.IsNoStored);
  }

  get isNoCountUnread(): boolean {
    return getBit(+this.tf, TransientFlag.isNoCountUnread);
  }

  get isSubstring(): boolean {
    return getBit(+this.pf, PersistentFlag.IsSubstring);
  }

  get isCountUnread() {
    return !this.isNoCountUnread;
  }

  get isStore() {
    return !this.isNoStore;
  }

  get isFromChannel(): boolean {
    // TODO: remove direct&group type
    return [ConvoType.groupchat, ConvoType.direct, 'direct', 'group'].indexOf(this.ct) > -1;
  }

  get indexMessageBookmark() {
    return this.extraData?.linkedMessages?.indexMessageBookmark;
  }

  get messageBookmark() {
    return this.extraData?.linkedMessages?.messageBookmark;
  }

  get indexMessageReply() {
    return this.extraData?.linkedMessages?.indexMessageReply;
  }

  get messageReply() {
    return this.extraData?.linkedMessages?.messageReply;
  }

  constructor(obj?: Partial<ChatMessage>) {
    this.client_ts = getTimeFromChatServer();
    this.ts = this.client_ts;
    if (obj) {
      Object.assign(this, obj);
      if (obj['body']) {
        this.body = new MessageBody(this.body);
        // support transfer lowercase ct
        if (this.ct === <ConvoType>'DM') {
          this.ct = ConvoType.direct;
        } else if (this.ct === <ConvoType>'GC') {
          this.ct = ConvoType.groupchat;
        }

        if (this.ct === ConvoType.call && this.mt === MsgType.callMsg) {
          // TODO:
        } else if (this.mt === MsgType.imess) {
          // TODO:
        } else if (this.mt === MsgType.attachment) {
          if ((<AttachmentMessageDataV2>this.body.data)?.attachment) {
            this.body.data = {
              ...this.body.data,
              attachment: new AttachmentMessageData(this.body.data.attachment)
            };
          } else {
            this.body.data = new AttachmentMessageData(this.body.data);
          }
        } else if (this.mt === MsgType.message || this.mt === MsgType.whatsAppWelcome) {
          // progress normal message
        } else if (this.mt === MsgType.email) {
          if (typeof this.body.data === 'object') {
            this.body.data = new EmailMessageGeneral(this.body.data);
          }
        }
      }

      if (obj.metadata) {
        this.metadata = new Metadata(obj.metadata);
      }

      if (obj.extraData) {
        this.extraData = new ExtraData(obj.extraData);
      } else {
        this.extraData = new ExtraData({
          linkedMessages: <LinkedMessages>{
            snapshots: [],
            srcId: null
          }
        });
      }

      // special case, dont remove
      if (this.ts) {
        this.ts = +this.ts;
      }
      if (this.client_ts) {
        this.client_ts = +this.client_ts;
      }
    }
  }

  static createMessage(
    convo: ConversationGroup | Channel | ChannelHyperspace,
    body: MessageBody,
    user: string,
    mt: MsgType
  ) {
    const instance = new ChatMessage();

    instance.convo = convo.id; // chat system only know convo id but not convo group id. And currenlty only support public convo
    instance.body = body;
    instance.user = user;
    instance.ut = convo.userType;
    instance.ct = convo.convoType;
    instance.mt = mt;

    if (convo instanceof ChannelHyperspace) {
      instance.hs = convo.hyperspaceId;
    }

    return instance;
  }

  static createEmailMessage(convo: ConversationGroup, body: MessageBody, user: string, mt: MsgType, isNoStore = false) {
    const instance = new ChatMessage();

    instance.convo = convo.publicConversationId;
    instance.body = body;
    instance.user = user;
    instance.ut = convo.userType;
    instance.ct = convo.convoType;
    instance.mt = mt;
    if (isNoStore) {
      instance.markIsNoStore();
    }
    return instance;
  }

  static createMessagePublic(convo: ConversationGroup, body: MessageBody, user: string, mt: MsgType) {
    const instance = new ChatMessage();
    instance.convo = convo.conversationGroupId;
    instance.body = body;
    instance.user = user;
    instance.ut = UserType.Customer;
    instance.ct = convo.convoType;
    instance.mt = mt;
    return instance;
  }

  static createSystemMessage(
    convo: ConversationGroup | Channel | ChannelHyperspace,
    body: MessageBody,
    user: string,
    st: SystemType
  ) {
    const instance = new ChatMessage();
    instance.convo = convo.id; // chat system only know convo id but not convo group id. And currenlty only support public convo
    instance.ut = convo.userType;
    instance.body = body;
    instance.user = user;
    instance.ct = convo.convoType;
    instance.st = st;
    instance.mt = MsgType.system;

    if (convo instanceof ChannelHyperspace) {
      instance.hs = convo.hyperspaceId;
    }

    return instance;
  }

  static createSeenMessage(convo: ConversationGroup | Channel | ChannelHyperspace) {
    const instance = new ChatMessage();
    instance.convo = convo.id; // chat system only know convo id but not convo group id. And currenlty only support public convo
    instance.ut = convo.userType;
    instance.ts = 0;

    instance.body = new MessageBody();
    instance.ct = convo.convoType;
    instance.st = SystemType.SEEN;
    instance.mt = MsgType.system;
    instance.markIsNoStore();

    if (convo instanceof ChannelHyperspace) {
      instance.hs = convo.hyperspaceId;
    }

    return instance;
  }

  static createEmailSeenMessage(convo: ConversationGroup) {
    const instance = new ChatMessage();
    instance.convo = convo.publicConversationId; // chat system only know convo id but not convo group id. And currenlty only support public convo
    instance.ut = convo.userType;

    instance.body = new MessageBody();
    instance.ct = convo.convoType;
    instance.st = SystemType.SEEN;
    instance.mt = MsgType.system;
    instance.markIsNoStore();
    return instance;
  }

  static createDeleteMessage(message: ChatMessage) {
    const instance = new ChatMessage(message);
    instance.body = new MessageBody({});
    instance.mt = MsgType.system;
    instance.st = SystemType.DELETE;
    return instance;
  }

  markIsNoStore() {
    this.tf = setBit(this.tf, TransientFlag.IsNoStored);
    return this;
  }

  markIsRetry() {
    this.tf = setBit(this.tf, TransientFlag.IsRetry);
    return this;
  }

  toJSONString(): string {
    const cloned = Object.assign({}, this);
    if (cloned.body.data !== null && typeof cloned.body.data === 'object') {
      cloned.body.data = JSON.stringify(cloned.body.data);
    }
    return JSON.stringify(cloned);
  }
}
