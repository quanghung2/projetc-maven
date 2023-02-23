import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { CallManagement, WebrtcState } from './webrtc.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'call_webrtc' })
export class WebrtcStore extends Store<WebrtcState> {
  constructor() {
    super(<WebrtcState>{
      callManagement: <CallManagement>{
        ringing: false,
        isHold: false,
        canHold: false,
        canDTMF: false
      }
    });
  }
}
