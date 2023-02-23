import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firstWord'
})
export class FirstWordPipe implements PipeTransform {
  transform(value: string): string | boolean {
    if (!value) {
      return '';
    }
    const firstWords: string[] = [];
    if (value.indexOf(' ') >= 0) {
      value
        .split(' ')
        .filter(w => !!w)
        .map(words => {
          firstWords.push(String.fromCodePoint(words.codePointAt(0)));
        });
    } else if (value.indexOf('@') > 0) {
      firstWords.push(value[0]);
    } else {
      firstWords.push(value[0]);
    }

    if (firstWords.length >= 2) {
      return (firstWords[0] + firstWords[1]).toUpperCase();
    } else {
      return value.substr(0, 2).toUpperCase();
    }
  }
}
