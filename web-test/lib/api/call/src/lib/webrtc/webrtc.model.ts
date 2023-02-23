import { Contact } from '@b3networks/api/contact';
import { User } from '@b3networks/api/workspace';
import { UA } from 'jssip';
import { RTCSession } from 'jssip/lib/RTCSession';
import { Observable } from 'rxjs';

export enum UAEventStatus {
  connecting = 'connecting',
  connected = 'connected',
  registered = 'registered',

  // fail
  unregistered = 'unregistered',
  // handle reconnect
  disconnected = 'disconnected',
  registrationFailed = 'registrationFailed',
  registrationExpiring = 'registrationExpiring',

  // status call
  failed = 'failed'
}

export interface WebrtcState {
  statusUA: {
    status: UAEventStatus;
    reason?: string;
  };
  session: RTCSession;
  callManagement: CallManagement;
  ua: UA;
}

export interface CallManagement {
  isRemote: boolean;
  ringing: boolean;
  isHold: boolean;
  canHold: boolean;
  canDTMF: boolean;
  timerCall: TimerCall;
  member: User | Contact;
  // display UI
  status: string;
  displayMember: Observable<string>;
  isZoom: boolean;
  isRoom: boolean;
  isMute: boolean;
}

export class TimerCall {
  second = 0;
  private intervalTime: any;

  countTimeCall() {
    this.second = 0;
    this.intervalTime = setInterval(() => {
      this.second++;
    }, 1000);
  }

  clearIntervalTime() {
    if (this.intervalTime) {
      clearInterval(this.intervalTime);
      this.intervalTime = null;
    }
  }
}

export enum Originator {
  LOCAL = 'local',
  REMOTE = 'remote',
  SYSTEM = 'system'
}

export enum SessionDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing'
}

export interface SipResponse {
  username: string;
  password: string;
  fullUsername: string;
  domain: string;
  expiredAt: number;
}
