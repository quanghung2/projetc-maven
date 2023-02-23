import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sentenceCase'
})
export class SentenceCasePipe implements PipeTransform {
  transform(text: string, arg?: string): any {
    if (text) {
      const val = text?.replace(arg, ' ');
      return val;
    }
    return '';
  }
}
