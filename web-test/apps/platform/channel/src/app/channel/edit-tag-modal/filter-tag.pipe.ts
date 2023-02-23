import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterTags'
})
export class FilterTagsPipe implements PipeTransform {
  transform(array: Array<string>, search: string): Array<string> {
    if (!search) {
      return array;
    }
    return array.filter(option => option.toLowerCase().includes(search.toLowerCase()));
  }
}
