import { ChatMessage } from '../../chat/chat-message.model';

export interface MessageSearchResult {
  count: number;
  total: number;
  messages: ChatMessage[];
  fromMillis: number;
  toMillis: number;
}

export class RequestSearchCriteria {
  convoIDs: string[];
  userIDs: string[];
  message: string;
  fromMillis: number;
  toMillis: number;
  limit: number;
  asc: boolean; // default decs
}
