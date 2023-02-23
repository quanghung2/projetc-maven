import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const REGEX_PATTERN = {
  URL: /((ftp|https?):\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g,
  EMAIL_ADDRESS: /\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+/g
};

@Pipe({
  name: 'linkify'
})
export class LinkifyPipe implements PipeTransform {
  constructor(private _domSanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml | string {
    return this._domSanitizer.bypassSecurityTrustHtml(this.linkifyStr(value));
  }

  private linkifyStr(text: string): string {
    return text
      .trim()
      .split(/\s+/)
      .map((baseText: string) => {
        const matchedTexts = baseText.match(REGEX_PATTERN.EMAIL_ADDRESS) || baseText.match(REGEX_PATTERN.URL) || [];
        if (matchedTexts.length) {
          matchedTexts.forEach(matchedText => {
            baseText = this.formatText(baseText, matchedText);
          });
        }
        return baseText;
      })
      .join(' ');
  }

  private formatEmailText(baseText: string, matchedText: string = '') {
    return baseText.replace(matchedText, `<a href="mailto:${matchedText}">${matchedText}</a>`);
  }

  private formatUrlText(baseText: string, matchedText: string = '') {
    const prefix =
      matchedText.toLowerCase().indexOf('http') === -1 && matchedText.toLowerCase().indexOf('ftp') === -1 ? '//' : '';
    return baseText.replace(matchedText, `<a target="_blank" href="${prefix + matchedText.trim()}">${matchedText}</a>`);
  }

  private formatText(baseText: string, matchedText: string = '') {
    if (matchedText.match(REGEX_PATTERN.EMAIL_ADDRESS) !== null) {
      return this.formatEmailText(baseText, matchedText);
    }
    if (matchedText.match(REGEX_PATTERN.URL) !== null) {
      return this.formatUrlText(baseText, matchedText);
    }
    return baseText;
  }
}
