import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({
  name: 'instanceof',
  pure: true
})
export class InstanceofPipe implements PipeTransform {
  public transform<V, R>(value: V, Type: abstract new (...args: any) => R): R | undefined {
    return value instanceof Type ? value : undefined;
  }
}
