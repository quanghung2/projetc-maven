import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, HashMap, StoreConfig } from '@datorama/akita';
import { ChatMessage } from '../chat/chat-message.model';
import { MESSAGE_STORE_NAME } from './history-message.model';

export interface ChatMessageUI {
  isReservation?: boolean;
  isOpenedReservation?: boolean;
  isFinisedReservation?: boolean;
  isFinisedWrapup?: boolean;
}

export interface CallMessageUIState {
  hasIMessAction?: boolean;
  finishedIMessAction?: boolean;
  finisedWrapup?: boolean;
}

export interface HistoryMessageState extends EntityState<ChatMessage>, ActiveState {
  bookmarkExpandMap: HashMap<ChatMessage>; // messageId => msg expaned
}

export type HistoryMessageUIState = EntityState<ChatMessageUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: MESSAGE_STORE_NAME, idKey: 'clientId' })
export class HistoryMessageStore extends EntityStore<HistoryMessageState> {
  constructor() {
    super({
      bookmarkExpandMap: {}
    });
  }
}
