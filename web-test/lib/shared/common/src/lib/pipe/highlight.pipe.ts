import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, search: string): string {
    if (!search) {
      return text;
    }

    search = search?.toString();

    const pattern = search
      .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
      .split(' ')
      .filter(t => t.length > 0)
      .join('|');
    const regex = new RegExp(pattern, 'gi');
    const match = text?.match(regex);

    if (!match) {
      return text;
    }

    return text.replace(regex, m => `<mark>${m}</mark>`);
  }
}
