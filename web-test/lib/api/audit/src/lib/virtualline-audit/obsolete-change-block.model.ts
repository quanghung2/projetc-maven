export class TTSDetails {
  languageCode: string = 'en';
  message: string = '';
  pitch: string = 'default';
  rate: string = 'default';
  voiceCode: string = 'default';
  constructor(obj?: Partial<TTSDetails>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
