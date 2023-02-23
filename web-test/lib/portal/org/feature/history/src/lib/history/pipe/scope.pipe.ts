import { Pipe, PipeTransform } from '@angular/core';
import { EnumScope } from '@b3networks/api/data';

@Pipe({
  name: 'scopeView'
})
export class ScopePipe implements PipeTransform {
  transform(scope: EnumScope): string {
    if (scope === EnumScope.org) {
      return 'Everyone';
    }
    if (scope === EnumScope.personal) {
      return 'Me';
    }
    // team
    return 'Team';
  }
}
