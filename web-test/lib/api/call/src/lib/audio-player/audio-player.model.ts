export interface AudioWebRTC {
  name: TypeSound;
  audio: HTMLAudioElement;
}

export enum TypeSound {
  ringing = 'ringing', // ring when has incoming
  ringback = 'ringback', // ring when outgoing
  answered = 'answered',
  rejected = 'rejected',
  hold = 'hold',
  dial = 'dial'
}
