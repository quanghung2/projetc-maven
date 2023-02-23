import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import {
  ConversationGroup,
  ConversationGroupUI,
  ConvoGroupStoreName,
  InboxEmailPaging
} from './model/conversation-group.model';

export interface ConversationGroupState extends EntityState<ConversationGroup>, ActiveState {
  ui: {
    limit: number;
    next: string;
    prev: string;
  };
  emailInboxPaging: InboxEmailPaging;
  isDisconnected: boolean;
}

export type ConversationGroupUIState = EntityState<ConversationGroupUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: ConvoGroupStoreName, idKey: 'conversationGroupId' })
export class ConversationGroupStore extends EntityStore<ConversationGroupState> {
  override ui: EntityUIStore<ConversationGroupUIState>;
  loadingLivechat: boolean;

  constructor() {
    super({
      emailInboxPaging: <InboxEmailPaging>{
        loaded: false,
        page: 1,
        perPage: 10
      },
      loading: false
    });

    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(
      entity =>
        <ConversationGroupUI>{
          loaded: false,
          loadedFirst: false,
          viewingOlderMessage: false,
          file: {
            loaded: false,
            page: 1,
            perPage: 10,
            hasMore: true
          },
          previewHistory: {
            loadedFirst: false,
            hasMoreTop: false,
            hasMoreBottom: false
          }
        }
    );
  }

  setLoadingLivechat(value: boolean) {
    this.update({ loadingLivechat: value });
  }
}
