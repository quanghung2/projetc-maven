import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { filter, map } from 'rxjs/operators';
import { IntegrationState, IntegrationStore } from './integration.store';

@Injectable({ providedIn: 'root' })
export class IntegrationQuery extends QueryEntity<IntegrationState> {
  approvalBot$ = this.select('approvalBot');

  constructor(protected override store: IntegrationStore) {
    super(store);
  }

  selectAllByChatUuid(uuid: string) {
    return this.selectAll({ filterBy: bot => bot.msChatUuid === uuid, limitTo: 1 }).pipe(
      filter(x => x != null),
      map(x => x[0])
    );
  }

  getBotByChatUuid(chatUuid: string) {
    const integration = this.getAll({ filterBy: bot => bot.msChatUuid === chatUuid, limitTo: 1 });
    return integration.length > 0 ? integration[0] : null;
  }
}
