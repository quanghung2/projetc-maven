import { TtsConfig } from '../tts/tts-config';

export class Text2Speech {
  entries: TtsConfig[] = [];

  constructor(obj?: any) {
    Object.assign(this, obj);
    this.entries = this.entries.map(tts => new TtsConfig(tts));
  }
}
