import { MailBoxAction } from '../../enums';
import { SpeechEntry, Text2Speech } from './cr-config.model';

export class Text2SpeechCommon {
  action: MailBoxAction;
  flowUuid: string;
  msg: Text2Speech;
  notifyEmail: string;
  forwardDest: any; // TODO :ask BE
  doPlayMsg: boolean;

  constructor(obj?: Partial<Text2SpeechCommon>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.msg) {
        this.msg =
          obj.msg.entries?.length > 0
            ? new Text2Speech(obj.msg)
            : new Text2Speech({
                entries: [new SpeechEntry()]
              });
      }
    }
  }
}

export class MailBox {
  elapsedTime: number;
  notifyEmail: string;
  afterCallAction: MailBoxAction;
  tts: Text2Speech;

  unanswered: Text2SpeechCommon;
  busy: Text2SpeechCommon;
  dnd: Text2SpeechCommon;
  unreachable: Text2SpeechCommon;
  offline: Text2SpeechCommon;
  nonOfficeHours: Text2SpeechCommon;
  publicHoliday: Text2SpeechCommon;
  cancel: Text2SpeechCommon;
  version: 'v2' | null;

  constructor(obj?: Partial<MailBox>) {
    if (obj) {
      Object.assign(this, obj);

      if (obj?.unanswered) {
        this.unanswered = new Text2SpeechCommon(obj.unanswered);
      }
      if (obj?.busy) {
        this.busy = new Text2SpeechCommon(obj.busy);
      }
      if (obj?.nonOfficeHours) {
        this.nonOfficeHours = new Text2SpeechCommon(obj.nonOfficeHours);
      }
    }
  }
}
