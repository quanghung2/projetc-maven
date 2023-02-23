import { Injectable } from '@angular/core';
import { ExtType } from '@b3networks/api/bizphone';
import { Query } from '@datorama/akita';
import { MeState, MeStore } from './me.store';

@Injectable({ providedIn: 'root' })
export class MeQuery extends Query<MeState> {
  me$ = this.select(state => state.me);

  isPermission$ = this.select(state => state.isPermission);

  assigningVoiceCall$ = this.select(state => state.me?.assignedTxn);

  licence$ = this.select(state => state.me?.licence);

  systemStatus$ = this.select(state => state.me?.systemStatus);

  extensionHasCallerId$ = this.select(state => !!state.me?.callerId);

  extensionKey$ = this.select(state => state.me?.extKey);

  constructor(protected override store: MeStore) {
    super(store);
  }

  getLicense() {
    return this.getValue().me?.licence;
  }

  isSupervisor() {
    return this.getValue().me?.isSupervisor;
  }

  hasCCSubscription() {
    return this.getValue().me?.type === ExtType.CALL_CENTER;
  }

  getMe() {
    return this.getValue().me;
  }

  getPermission() {
    return this.getValue()?.isPermission;
  }
}
