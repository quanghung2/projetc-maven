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

export class TtsConfig {
  msg: string;
  msgUrl: string;
  msgType: TTSType = TTSType.speech;
  language = 'en';
  gender = 'FEMALE';
  vendor = 'GOOGLE';
  voiceCode = 'en-US-WaveNet-F';
  pitch = 5;
  rate = 5;
  length = -1;
  background: boolean;
  privateAcl: boolean;

  constructor(msg: string) {
    const xmlDoc = new DOMParser().parseFromString(`<xml>${msg}</xml>`, 'text/xml');

    if (msg.indexOf('url') !== -1) {
      this.msgType = TTSType.mp3;
      const urlNode = xmlDoc.getElementsByTagName('url')[0].childNodes[0];
      this.msgUrl = urlNode ? urlNode.nodeValue : '';
      const lengthAtr = xmlDoc.getElementsByTagName('url')[0].getAttributeNode('length');
      if (lengthAtr) {
        this.length = parseInt(lengthAtr.nodeValue, 10);
      }
      if (xmlDoc.getElementsByTagName('url')[0].getAttributeNode('background')) {
        this.background = true;
      }
      if (!!xmlDoc.getElementsByTagName('url')[0].getAttributeNode('acl')) {
        this.privateAcl = true;
      }
    } else if (msg.indexOf('speech') !== -1) {
      this.msgType = TTSType.speech;
      const child = xmlDoc.getElementsByTagName('speech')[0];
      for (let i = 0; i < child.attributes.length; i++) {
        if (child.attributes[i].nodeName === 'language') {
          this.language = child.attributes[i].nodeValue;
        } else if (child.attributes[i].nodeName === 'vendor') {
          this.vendor = child.attributes[i].nodeValue;
        } else if (child.attributes[i].nodeName === 'gender') {
          this.gender = child.attributes[i].nodeValue;
        } else if (child.attributes[i].nodeName === 'voice-code') {
          this.voiceCode = child.attributes[i].nodeValue;
        } else if (child.attributes[i].nodeName === 'pitch') {
          this.pitch = parseInt(child.attributes[i].nodeValue, 10);
        } else if (child.attributes[i].nodeName === 'rate') {
          this.rate = parseInt(child.attributes[i].nodeValue, 10);
        }
      }
      this.msg = child.textContent;
    } else {
      this.msg = msg;
    }
  }

  static createMp3Tts() {
    const instance = new TtsConfig('');
    instance.msgType = TTSType.mp3;
    return instance;
  }

  get languageDisplay() {
    return languages[this.language];
  }

  xml() {
    let message;
    let params = [];

    if (this.msgType === TTSType.mp3) {
      params = [];
      if (this.length && this.length > -1) {
        params.push(`length="${this.length}"`);
      }
      if (this.background) {
        params.push(`background="true"`);
      }
      if (this.privateAcl) {
        params.push(`acl="private"`);
      }

      message = `<url ${params.join(' ')}>${this.msgUrl}</url>`;
    } else {
      params = [];
      if (this.language) {
        params.push(`language="${this.language}"`);
      }
      if (this.gender) {
        params.push(`gender="${this.gender}"`);
      }
      if (this.voiceCode) {
        params.push(`voice-code="${this.voiceCode}"`);
      }
      if (this.vendor) {
        params.push(`vendor="${this.vendor}"`);
      }
      if (this.pitch) {
        params.push(`pitch="${this.pitch}"`);
      }
      if (this.rate) {
        params.push(`rate="${this.rate}"`);
      }

      message = `<speech ${params.join(' ')}>${this.msg}</speech>`;
    }

    return message;
  }
}
