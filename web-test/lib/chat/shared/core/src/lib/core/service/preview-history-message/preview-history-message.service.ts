import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChatMessage } from '@b3networks/api/workspace';
import { PreviewHistoryMessageStore } from './preview-history-message.store';

@Injectable({ providedIn: 'root' })
export class PreviewHistoryMessageService {
  constructor(private http: HttpClient, private store: PreviewHistoryMessageStore) {}

  removeMessage(message: ChatMessage | string) {
    if (message instanceof ChatMessage) {
      this.store.remove(message.clientId);
    } else {
      this.store.remove(message);
    }
  }

  upsertManyMessages(messages: ChatMessage[]) {
    this.store.upsertMany(messages, {
      baseClass: ChatMessage
    });
  }

  removeManyMessage(messagesId: string[]) {
    this.store.remove(messagesId);
  }

  cleanupOneConvoMessages(convoUuid: string) {
    this.store.remove((entity: ChatMessage) => entity.convo === convoUuid);
  }

  cleanupConvoMessages(listConvoLoaded: string[]) {
    this.store.remove((entity: ChatMessage) => {
      return listConvoLoaded.indexOf(entity.convo) > -1;
    });
  }

  cleanupAllMessage() {
    this.store.remove();
  }
}
