import { Pipe, PipeTransform } from '@angular/core';
import { CampaignTxn } from '@b3networks/api/callcenter';

@Pipe({
  name: 'forceHangup'
})
export class ForceHangupPipe implements PipeTransform {
  transform(value: CampaignTxn): string {
    return value.eventLogs.find(e => e.action === 'forceHangup').name;
  }
}
