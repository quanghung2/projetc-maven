import { States } from '../state/state.model';

export enum EnumReservationType {
  Voice = 'Voice',
  SMS = 'SMS'
}

export enum EnumCallStatus {
  Answered = 'answered',
  Unanswered = 'unanswered'
}

export class Lastest5Calls {
  code: string;
  note: string;
  status: string;
  first: States;
}

export interface Intelligence {
  callerName: string;
  restaurantName: string;
  reservationType: EnumReservationType;
}

export interface QueueInfo {
  name: string;
  uuid: string;
}

export class ReservationInfo {
  key: string;
  time: number;
  queue: QueueInfo;
  endTime: number;
  orgUuid: string;
  txnUuid: string;
  startTime: number;
  callStatus: string;
  queuedTime: number;
  callDuration: number;
  intelligence: Intelligence;
  waitDuration: number;
  id: number;
  tag: string;
  note: string;
  voicemail: string;
  fileVoiceMail: string;
  restaurantNumber: string;
  callerNumber: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface ReservationFilter {
  startTime: any;
  endTime: any;
  callStatus: string;
  tag: string;
  callerNumber: string;
}

export interface Max {
  holdDuration: number;
  talkDuration: number;
  wrapDuration: number;
  connectDuration: number;
}

export interface Sum {
  answered: number;
  assigned: number;
  unanswered: number;
  holdDuration: number;
  talkDuration: number;
  wrapDuration: number;
  connectDuration: number;
}
