import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'split'
})
export class SplitPipe implements PipeTransform {
  transform(value: string, arg1: string): string[] {
    return value.split(arg1);
  }
}
