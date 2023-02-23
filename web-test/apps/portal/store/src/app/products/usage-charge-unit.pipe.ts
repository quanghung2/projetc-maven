import { Pipe, PipeTransform } from '@angular/core';

const map = {
  // 'fax-incoming': 'fax',
  // 'fax-outgoing': 'fax',
  'fax-incoming': 'minute',
  'fax-outgoing': 'minute',
  'call-incoming': 'minute',
  'call-outgoing': 'minute',
  'sms-outgoing': 'message',
  'sms-incoming': 'message'
};

@Pipe({
  name: 'usageChargeUnit'
})
export class UsageChargeUnitPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return value ? map[value] : value;
  }
}
