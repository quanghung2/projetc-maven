import { Pipe, PipeTransform } from '@angular/core';
import { CampaignType } from '@b3networks/api/callcenter';

@Pipe({
  name: 'typeCampaign'
})
export class TypeCampaignPipe implements PipeTransform {
  transform(type: CampaignType, queueUuid?: string): string {
    if (type === CampaignType.sms) {
      return 'SMS';
    } else if (type === CampaignType.voice && !queueUuid) {
      return 'Robocall';
    } else if (type === CampaignType.voice && queueUuid) {
      return 'Outbound Contact Center';
    } else {
      return type;
    }
  }
}
