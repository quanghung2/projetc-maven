import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sentenceCase'
})
export class SentenceCasePipe implements PipeTransform {
  constructor() {}

  transform(value: string): string {
    const first = value.substr(0, 1).toUpperCase();
    return first + value.substr(1).toLowerCase();
  }
}
