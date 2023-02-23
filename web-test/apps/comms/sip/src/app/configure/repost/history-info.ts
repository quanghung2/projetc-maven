export class HistoryInfo {
  startTime: string;
  endTime: string;
  dest: string;
  callType: string;
  sipUsername: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum CallType {
  outgoing = 'outgoing',
  incoming = 'incoming'
}
