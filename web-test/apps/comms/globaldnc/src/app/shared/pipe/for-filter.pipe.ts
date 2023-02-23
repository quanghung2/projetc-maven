import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'forFilter',
  pure: false
})
export class ForFilterPipe implements PipeTransform {
  transform(items: any[], names: string, keyword: string): any {
    if (!items || !names || keyword) {
      return items;
    }
    return items.filter(item => {
      let f = false;
      names.split(',').forEach(name => {
        try {
          if (item[name].indexOf(keyword) !== -1) {
            f = true;
          }
        } catch (e) {}
      });
      return f;
    });
  }
}
