import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitText'
})
export class SplitTextPipe implements PipeTransform {
  constructor() {}
  transform(value: string): string {
    const text = value.split(/(?=[A-Z])/).join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
