import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, arg: string): string {
    const limit = parseInt(arg, 10);
    const trail = '...';

    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
