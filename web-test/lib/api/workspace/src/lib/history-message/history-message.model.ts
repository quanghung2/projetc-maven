import { HashMap } from '@datorama/akita';
import { ChatMessage } from '../chat/chat-message.model';

export class HistoryMessage {
  fromMillis: number;
  toMillis: number;
  messages: Array<ChatMessage> | null;
  hyperspaceId: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);

      if (this.hyperspaceId) {
        this.messages = this.messages?.map(me => new ChatMessage({ ...me, hs: this.hyperspaceId })) || [];
      } else {
        this.messages = this.messages?.map(me => new ChatMessage(me)) || [];
      }

      this.fromMillis = +this.fromMillis;
      this.toMillis = +this.toMillis;
    }
  }
}

export class HistoryMessageRange {
  messages: Array<ChatMessage> | null;
  from: string; // msgId
  to: string; // msgId
  bookmarks: HashMap<string>;

  constructor(obj?: Partial<HistoryMessageRange>) {
    if (obj) {
      Object.assign(this, obj);
      if (!obj?.bookmarks) {
        this.bookmarks = {};
      }
      this.messages = this.messages?.map(msg => new ChatMessage(msg)) || [];
    }
  }
}

export interface FilterConvoMessageReq {
  fromMillis?: number | string;
  toMillis?: number | string;
  limit?: number | string;
  order?: 'asc' | 'desc';

  // for channel , conversation
  conversations: string[];

  // hyperspace
  hyperchannelId?: string;
  hyperspaceId?: string;
}

export interface FilterConvoMessageRangeRequest {
  convoId: string;
  limit: number;
  fromInclusive?: boolean;
  toInclusive?: boolean;
  beforeFromSize?: number; // null = 0
  afterToSize?: number; // null = 0
  isAsc?: boolean;
  options?: {
    withBookmarks?: boolean;
  };

  // msgId
  from?: string;
  to?: string;

  // timestamp
  fromMillis?: string;
  toMillis?: string;
}

export interface ConfigStore {
  isNoStore: boolean;
  noLoading: boolean;
}

/**
 * A factory function that creates HistoryMessage
 */
export function createHistoryMessage(params: Partial<HistoryMessage>) {
  return {} as HistoryMessage;
}

export const MESSAGE_STORE_NAME = 'workspace_message';
