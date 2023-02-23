import { Pipe, PipeTransform } from '@angular/core';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'selectExtension'
})
export class SelectExtensionPipe implements PipeTransform {
  constructor(private extensionQuery: ExtensionQuery) {}

  transform(extKey: string) {
    if (!extKey) {
      return of(null);
    }

    return this.extensionQuery.selectExtension(extKey).pipe(map(ext => ext || new ExtensionBase({ extKey: extKey })));
  }
}
