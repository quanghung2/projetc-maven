import { Pipe, PipeTransform } from '@angular/core';

/**
 * Replace special characters with white spaces
 * @author nghiatruong
 */
@Pipe({
  name: 'replaceSpecialCharacter'
})
export class ReplaceSpecialCharacterPipe implements PipeTransform {
  transform(input: any): any {
    let output;
    if (input) {
      const pattern = '[^A-Za-z0-9]';
      const regExp = RegExp(pattern, 'gmi');
      output = input.replace(regExp, ' ');
    } else {
      output = input;
    }
    return output;
  }
}
