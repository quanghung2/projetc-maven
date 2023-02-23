import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe {
  transform(value: string, arg: string): string {
    let limit = parseInt(arg, 10);
    let trail = '...';

    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
