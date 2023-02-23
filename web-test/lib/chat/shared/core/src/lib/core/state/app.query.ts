import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppState } from './app-state.model';
import { AppStore } from './app.store';

@Injectable({ providedIn: 'root' })
export class AppQuery extends Query<AppState> {
  showMainSidebar$ = this.select(state => state.showMainSidebar);
  sidebarTabActive$ = this.select(state => state.sidebarTabActive);
  emailUWState$ = this.select(state => state.emailUWState);
  hasMoreEndTxns$ = this.select(state => state.endTxnsUWState?.hasMore);
  hasMoreEndTxnsOrg$ = this.select(state => state.endTxnsUWOrgState?.hasMore);
  showRightSidebar$ = this.select(state => state.showRightSidebar);
  showLeftSidebar$ = this.select(state => state.showLeftSidebar);
  modeLeftSidebar$ = this.select(state => state.modeLeftSidebar).pipe(distinctUntilChanged(), debounceTime(10));
  modeRightSidebar$ = this.select(state => state.modeRightSidebar).pipe(distinctUntilChanged(), debounceTime(10));
  mentionCountTeamChat$ = this.select(state => state.mentionCountTeamChat);
  quillEditor$ = this.select(state => state.quillEditor);
  triggerScrollBottomView$ = this.select(state => state.triggerScrollBottomView);
  memberMenu$ = this.select('memberMenu');

  constructor(protected override store: AppStore) {
    super(store);
  }

  endTxnsUWState() {
    return this.getValue()?.endTxnsUWState;
  }

  endTxnsUWOrgState() {
    return this.getValue()?.endTxnsUWOrgState;
  }
}
