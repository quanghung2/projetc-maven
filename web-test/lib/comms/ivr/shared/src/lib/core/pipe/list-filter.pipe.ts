import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'listFilter'
})
export class ListFilterPipe implements PipeTransform {
  transform(list: any[], property: string, query: string): any[] {
    if (!query) {
      return list;
    }

    const result: any[] = _.filter(list, (item: any) => {
      const correctInput = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const subStringRegex = new RegExp(correctInput, 'i');

      if (property) {
        return subStringRegex.test(item[property]);
      }

      return subStringRegex.test(item);
    });

    return result;
  }
}
