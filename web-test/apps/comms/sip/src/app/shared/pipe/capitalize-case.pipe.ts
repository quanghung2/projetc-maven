import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizeCase',
  pure: false
})
export class CapitalizeCasePipe implements PipeTransform {
  transform(input: string): string {
    if (!input) {
      return '';
    } else {
      return input.replace(/\w\S*/g, txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase());
    }
  }
}
