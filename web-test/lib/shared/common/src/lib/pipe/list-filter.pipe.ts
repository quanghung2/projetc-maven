import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'listFilter'
})
export class ListFilterPipe implements PipeTransform {
  transform(list: any[], property: string, query: string): any[] {
    if (!query) {
      return list;
    }

    return list.filter((item: any) => {
      const correctInput = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const subStringRegex = new RegExp(correctInput, 'i');

      if (property) {
        return subStringRegex.test(item[property]);
      }

      return subStringRegex.test(item);
    });
  }
}
