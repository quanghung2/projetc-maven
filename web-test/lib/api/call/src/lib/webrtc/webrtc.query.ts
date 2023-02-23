import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { RTCSession } from 'jssip/lib/RTCSession';
import { WebrtcState } from './webrtc.model';
import { WebrtcStore } from './webrtc.store';

@Injectable({ providedIn: 'root' })
export class WebrtcQuery extends Query<WebrtcState> {
  statusUA$ = this.select('statusUA');
  session$ = this.select('session');
  callManagement$ = this.select('callManagement');
  ua$ = this.select('ua');

  constructor(protected override store: WebrtcStore) {
    super(store);
  }

  get session(): RTCSession {
    return this.getValue().session;
  }

  get UA() {
    return this.getValue().ua;
  }

  get callManagement() {
    return this.getValue().callManagement;
  }

  get isBusy(): boolean {
    return !!this.getValue().session;
  }
}
