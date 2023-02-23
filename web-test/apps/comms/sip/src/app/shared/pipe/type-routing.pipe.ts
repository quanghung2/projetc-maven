import { EnumTypeRouting } from './../model/routing.model';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'typeRouting'
})
export class TypeRoutingPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (value) {
      if (value === EnumTypeRouting.isdn_incoming) {
        return 'ISDN Incoming';
      } else if (value === EnumTypeRouting.outgoing) {
        return 'Outgoing';
      }
    }
    return value;
  }
}
