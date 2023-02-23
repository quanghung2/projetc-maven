export const MAX_RECONNECT_TIME = 5;
export class ReconnectChatStragery {
  reconnectTimes: number;
  maxReconnect: number;
  isRun: boolean;

  constructor(obj?: Partial<ReconnectChatStragery>) {
    if (obj) {
      Object.assign(this, obj);
      if (!this.reconnectTimes) {
        this.reconnectTimes = 0;
      }
    }
  }

  get maxRetry() {
    return this.maxReconnect || MAX_RECONNECT_TIME;
  }

  get waitingTime() {
    return this.reconnectTimes < 2 ? 5 * 1000 : 10 * 1000;
  }

  get canReconnect() {
    return this.reconnectTimes < this.maxRetry;
  }

  increaseReconnectTime() {
    this.isRun = true;
    this.reconnectTimes = (this.reconnectTimes || 0) + 1;
  }

  reset() {
    this.isRun = false;
    this.reconnectTimes = 0;
  }
}

export enum SocketStatus {
  none = 'none',
  connecting = 'connecting',
  opened = 'opened',
  closed = 'closed'
}
