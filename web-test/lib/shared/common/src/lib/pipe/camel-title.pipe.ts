import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camel2title'
})
export class CamelTitlePipe implements PipeTransform {
  transform(value: string) {
    if (value) {
      return value
        .replace(/\.\w/g, match => `${match.toUpperCase()}`)
        .replace(/\./g, match => ' ')
        .replace(/([A-Z])/g, match => ` ${match}`)
        .replace(/^./, match => match.toUpperCase())
        .trim();
    } else {
      return '';
    }
  }
}
