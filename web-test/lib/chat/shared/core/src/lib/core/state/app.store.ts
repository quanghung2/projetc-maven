import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { AppState } from './app-state.model';

export function createInitialState(): AppState {
  return <AppState>{
    showMainSidebar: false,
    sidebarTabActive: null,
    emailUWState: {
      isExpandPersonal: true,
      isExpandTeam: false,
      isExpandTeammate: false
    },
    endTxnsUWState: {
      hasMore: false,
      perPage: 100,
      page: 1
    },
    endTxnsUWOrgState: {
      hasMore: false,
      perPage: 100,
      page: 1
    },
    mentionCountTeamChat: 0,
    quillEditor: {
      triggerfocus: false
    }
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_app_state' })
export class AppStore extends Store<AppState> {
  constructor() {
    super(createInitialState());
  }
}
