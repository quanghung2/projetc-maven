import { HashMap } from '@datorama/akita';
import { DeltaStatic } from 'quill';
import { RequestSearchCriteria } from './channel/model/search-criteria.model';
import { ChatMessage } from './chat/chat-message.model';

export enum TransientFlag {
  IsMentionedLegacy = 0,
  IsNoSeen = 1, // 1
  IsMentioned = 2,
  IsNotified = 3,
  isNoCountUnread = 17,
  IsRetry = 19,
  IsNoStored = 20 // 20
}

export enum PersistentFlag {
  IsSubstring = 10 // snapshot: long text has substring
}

export enum RoleType {
  owner = 'owner',
  member = 'member',
  guest = 'guest',
  followed = 'followed'
}

export enum AuthRole {
  Owner = 'OWNER',
  Admin = 'ADMIN',
  Member = 'MEMBER'
}

export enum ConversationType {
  private = 'private',
  public = 'public'
}

export enum Privacy {
  public = 'public',
  private = 'private'
}

export enum Status {
  active = 'active',
  archived = 'archived',
  closed = 'closed',
  opened = 'open',
  draft = 'draft',
  spam = 'spam',
  temp = 'temp',
  disabled = 'disabled'
}

export enum SystemAction {
  archived = 'archived',
  opened = 'opened',
  invited = 'invited',
  removed = 'removed',
  leaved = 'leaved'
}

export enum ConvoType {
  direct = 'dm',
  groupchat = 'gc',
  customer = 'cs',
  whatsapp = 'whatsapp',
  email = 'email',
  call = 'call',
  sms = 'sms',
  personal = 'personal'
}

export enum SystemMsgType {
  update = 'update',
  followed = 'followed',
  join = 'join',
  leave = 'leave',
  archived = 'archived',
  unarchived = 'unarchived',
  typing = 'typing',
  spam = 'spam',
  move = 'move',
  snooze = 'snooze',
  convoUpdateUsers = 'convoUpdateUsers', // hyper
  convoUpdateMetadata = 'convoUpdateMetadata', // hyper
  hyperspaceUpdateUsers = 'hyperspaceUpdateUsers', // hyper-management
  newUser = 'newUser',

  // inbox: txn
  created = 'created',
  updateData = 'updateData', // update txn
  assigned = 'assigned',
  unassigned = 'unassigned'
}

export enum MsgType {
  attachment = 'attachment',
  system = 'system',
  message = 'message',
  mcq = 'mcq', // multiple choice question from chatbot
  prechatsurvey = 'prechatsurvey',
  whatsAppWelcome = 'waw',
  webhook = 'webhook',
  email = 'email',
  online = 'online',
  offline = 'offline',
  callMsg = 'callmsg',
  imess = 'imess',
  case = 'case',
  transfer = 'transfer', // transfer from chatbot to agent,
  summary = 'summary' // summary information chatbot after transfer to agent
}

export enum UserType {
  // with user or contact
  TeamMember = 'team_member',
  Customer = 'cust',
  Agent = 'agent',
  System = 'system',

  // with integration
  Webhook = 'webhook',
  TeamBot = 'team_bot'
}

export enum GroupType {
  // in case you add additional group type, need to double check group type in ConversationGroupInfo
  Customer = 'customer', // use for live chat, chat with profile
  WhatsApp = 'whatsapp',
  SMS = 'sms',
  Email = 'email',
  Case = 'case'
}

export enum EmailSidebarType {
  personal = 'personal',
  inboxes = 'inboxes',
  teammates = 'teammates',
  Customer = 'customer'
}

export enum SystemType {
  SEEN = 'SEEN',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  PURGE = 'PURGE',
  STATUS = 'STATUS',
  CHANNEL_UPDATE = 'CHANNEL_UPDATE',
  CHANNEL_NEW = 'CHANNEL_NEW'
}

export enum ResponseLevel {
  PERSONAL = 'personal',
  ORGANIZATION = 'organization'
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export enum InteractiveBlockType {
  section = 'section',
  plaintext = 'plain_text',
  markdown = 'mrkdwn'
}

export enum NetworkStatus {
  online = 'online',
  offline = 'offline'
}

export enum ActionCase {
  txnTag2Case = 'txnTag2Case',
  txnTag2Customer = 'txnTag2Customer',
  assignTxn = 'assignTxn',
  endChat = 'endChat',
  notifyAgent = 'notifyAgent'
}

export class TypingState {
  constructor(public userUuid: string, public startAtMillis: number) {}
}

export interface ReplyMessage {
  user: string;
  text: string;
  message: ChatMessage;
}

export interface ViewUIStateCommon {
  // flag UI
  viewingOlderMessage?: boolean; // check scroll bottom immediately when trigger scroll event
  lastSeenMsgID?: string; // check last message to init convo with history
  needReceiveLiveMessage?: boolean; // when active convo , this flag will be true to dd live msg to store
  timeDestroy?: number; // 3h not active agian -> remove all state of this convo (history, message)

  // view UI
  enableScrollBottom?: boolean;
  viewDate?: number;
  userTypings?: TypingState[];
  draftMsg?: DeltaStatic;
  editingMessageId?: string;
  replyingMessage?: ReplyMessage;
  jumpMessageId?: string;

  // range miss msg
  disconnectedAt?: number; // websocket close // set when lastest-message received
  reconnectAt?: number; // websocket open  // set when ws-status opened (time server)

  // history v1
  loaded?: boolean;
  fromMillis?: number;
  toMillis?: number;
  hasMore?: boolean; // hasMoreTop

  // history v2: range
  loadedFirst?: boolean;
  hasMoreTop?: boolean;
  hasMoreBottom?: boolean;

  previewHistory?: {
    loadedFirst?: boolean;
    hasMoreTop?: boolean;
    hasMoreBottom?: boolean;
  };

  search?: {
    keyword?: string;
    form?: Partial<RequestSearchCriteria>;
    lastFrom?: number;
    hasRange?: boolean;
    groupResult?: Array<ChatMessage[]>;
    selectMsg: ChatMessage;
    mapBookmark: HashMap<string>; // extra messageId -> messageId
  };

  newMessage?: ChatMessage; // In live msg, show when unreadCount === 1, remove when sendseen
}
