export class Mp3Entry {
  s3Key: string;
  type = 'mp3';

  constructor(obj?: Partial<Mp3Entry>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class SpeechEntry {
  language: string;
  gender: string;
  pitch: number;
  rate: number;
  voiceCode: string;
  msg: string;
  type = 'speech';
  vendor?: string;

  constructor(obj?: Partial<SpeechEntry>) {
    if (obj) {
      Object.assign(this, obj);
    }
    this.language = this.language || 'en';
    this.pitch = this.pitch || 4;
    this.rate = this.rate || 4;
    this.voiceCode = this.voiceCode || 'en-US-WaveNet-F';
  }
}

export type Text2SpeechEntry = Mp3Entry | SpeechEntry;

export class Text2Speech {
  entries: Text2SpeechEntry[] = [];

  constructor(obj?: Partial<Text2Speech>) {
    if (obj) {
      Object.assign(this, obj);
      if (this.entries) {
        this.entries = this.entries.map(t => (t.type === 'mp3' ? new Mp3Entry(t) : new SpeechEntry(t)));
      }
    }
    this.entries = this.entries || [];
  }
}

export class CrConfig {
  isEnableIncoming: boolean;
  isEnableOutgoing: boolean;
  incomingTts: Text2Speech;
  outgoingTts: Text2Speech;
  crAction: CallRecordingAction;
  isConfigurable: boolean;

  constructor(obj?: Partial<CrConfig>) {
    if (obj) {
      Object.assign(this, obj);
      this.outgoingTts = new Text2Speech(this.outgoingTts);
      this.incomingTts = new Text2Speech(this.incomingTts);

      if (!this.isConfigurable) {
        this.isConfigurable = false;
      }
    }
  }
}

export enum CallRecordingAction {
  'RECORD_ALL' = 'RECORD_ALL',
  'ASK_TO_RECORD' = 'ASK_TO_RECORD'
}
