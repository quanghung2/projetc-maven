import { Injectable } from '@angular/core';
import { ChatMessage } from '@b3networks/api/workspace';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface PreviewHistoryMessageState extends EntityState<ChatMessage>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'chat-shared-core-preview-history', idKey: 'clientId' })
export class PreviewHistoryMessageStore extends EntityStore<PreviewHistoryMessageState> {
  constructor() {
    super({
      loading: false
    });
  }
}
