import { ConfigPieV2 } from '@b3networks/api/dashboard';
import { HashMap } from '@datorama/akita';

export class UserState {
  agentUuid: string;
  duration: string;
  extensionKey: string;
  extensionLabel: string;
  remark: string;
  state: State;
  userStateMap: HashMap<ConfigPieV2> = {};

  constructor(obj?: Partial<UserState>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get color() {
    return this.userStateMap[this.state]?.color;
  }

  get text() {
    return this.state === State.BUSY
      ? `Busy${this.remark ? ' - ' + this.remark : ''}`
      : this.userStateMap[this.state]?.displayText;
  }

  get info() {
    return `#${this.extensionKey} - ${this.extensionLabel}`;
  }
}

export enum State {
  AVAILABLE = 'available',
  ACW = 'acw',
  DIALING = 'dialing',
  TALKING = 'talking',
  HOLDING = 'holding',
  BUSY = 'busy',
  DND = 'dnd',
  OFFLINE = 'offline'
}
