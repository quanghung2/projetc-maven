import { Pipe, PipeTransform } from '@angular/core';
import { ConversationGroup } from '@b3networks/api/workspace';

@Pipe({
  name: 'starConvo'
})
export class StarConvoPipe implements PipeTransform {
  transform(convos: ConversationGroup[], isStar: boolean = true): ConversationGroup[] {
    if (convos) {
      return convos.filter(convo => (isStar ? convo.isStarred : !convo.isStarred));
    }
    return convos;
  }
}
