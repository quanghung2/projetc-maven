import { UploadEvent } from '@b3networks/api/file';
import { TtsVendor } from './tts-vendor';

export class TtsConfig {
  type: TTSType;
  order: number;
  url: string;
  language: string;
  gender: string;
  pitch = 5;
  rate = 5;
  voiceCode: string;
  vendor: string;
  message: string;
  s3Key: string;
  selectedVendor: TtsVendor;
  showAdvance = false;
  ttsVendors: TtsVendor[] = [];

  uploadEvent: UploadEvent;
  uploadIndicator = false;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (!this.type) {
      this.type = TTSType.speech;
    }
  }

  get isSpeech() {
    return this.type === TTSType.speech;
  }

  updateVendorData(selected, ttsVendors: TtsVendor[]) {
    this.gender = selected ? selected.gender : '';
    this.vendor = selected ? selected.vendor : '';
    this.voiceCode = selected ? selected.voiceCode : '';

    this.ttsVendors = ttsVendors;
    this.selectedVendor = selected;
  }
}

export enum TTSType {
  speech = 'speech',
  mp3 = 'mp3'
}

export const languages = {
  'ar-EG': 'Arabic (Egypt)',
  'ar-SA': 'Arabic (Saudi Arabia)',
  bg: 'Bulgarian',
  ca: 'Catalan',
  cs: 'Czech',
  da: 'Danish',
  de: 'German (Germany)',
  'de-AT': 'German (Austria)',
  'de-CH': 'German (Switzerland)',
  el: 'Greek',
  en: 'English (US)',
  'en-AU': 'English (Australia)',
  'en-IE': 'English (Ireland)',
  'en-CA': 'English (Canada)',
  'en-IN': 'English (India)',
  'en-SG': 'English (Singapore)',
  'en-UK': 'English (British)',
  es: 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  fi: 'Finish',
  fr: 'French (France)',
  'fr-CA': 'French (Canada)',
  'fr-CH': 'French (Switzerland)',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  ms: 'Malaysian',
  nl: 'Dutch',
  no: 'Norwegian',
  po: 'Polish',
  pt: 'Portuguese (Portugal)',
  'pt-BR': 'Portuguese (Brazil)',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sv: 'Swedish',
  ta: 'Tamil',
  th: 'Thai',
  tr: 'Turkish',
  vi: 'Vietnamese',
  zh: 'Chinese',
  'zh-HK': 'Chinese (Hongkong)',
  'zh-TW': 'Chinese (Taiwan)'
};
