import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizeCase',
})
export class CapitalizeCasePipe implements PipeTransform {
  // https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
  transform(content: string): string {
    return content ? content.charAt(0).toUpperCase() + content.slice(1) : '';
  }
}
