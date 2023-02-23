import { Pipe, PipeTransform } from '@angular/core';
import { NodeEntry } from '@b3networks/api/ivr';
import * as _ from 'lodash';

@Pipe({
  name: 'blockFilter'
})
export class BlockFilterPipe implements PipeTransform {
  transform(list: NodeEntry[], query: string): any[] {
    if (!query) {
      return list;
    }
    const result: any[] = _.filter(list, (item: NodeEntry) => {
      const correctInput = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const subStringRegex = new RegExp(correctInput, 'i');
      return subStringRegex.test(item.label);
    });
    return result;
  }
}
