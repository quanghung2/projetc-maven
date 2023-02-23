import { Injectable } from '@angular/core';
import { ChatMessage } from '@b3networks/api/workspace';
import { Order, QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { PreviewHistoryMessageState, PreviewHistoryMessageStore } from './preview-history-message.store';
@Injectable({ providedIn: 'root' })
export class PreviewHistoryMessageQuery extends QueryEntity<PreviewHistoryMessageState> {
  isLoading$ = this.selectLoading();

  constructor(protected override store: PreviewHistoryMessageStore) {
    super(store);
  }

  selectAllByConversation(convoUuid: string): Observable<ChatMessage[]> {
    return this.selectAll({
      filterBy: entity => entity.convo === convoUuid,
      sortBy: 'ts',
      sortByOrder: Order.ASC
    });
  }

  getAllByConvoNotReconcilation(
    convo: string,
    params?: { to: number; from: number; limit: number; exclude: boolean }
  ): ChatMessage[] {
    let sortByOrder: Order;
    if (params.to && !params.from) {
      sortByOrder = Order.DESC;
    } else if (params.from && !params.to) {
      sortByOrder = Order.ASC;
    } else if (params.from && params.to) {
      sortByOrder = Order.ASC;
    }
    return this.getAll({
      filterBy: entity => {
        let includeTime = true;
        if (params.to && !params.from) {
          includeTime = params.exclude ? entity.ts < params.to : entity.ts <= params.to;
        } else if (params.from && !params.to) {
          includeTime = params.exclude ? entity.ts > params.from : entity.ts >= params.from;
        }
        return entity.convo === convo && includeTime;
      },
      sortBy: 'ts',
      sortByOrder: sortByOrder,
      limitTo: params.from && params.to ? null : params.limit
    });
  }

  getMsgByRoot(convo: string, root: number, limit: number, isForward): ChatMessage[] {
    return this.getAll({
      filterBy: entity => {
        const includeTime = isForward ? entity.ts >= root : entity.ts <= root;
        return entity.convo === convo && includeTime;
      },
      sortBy: 'ts',
      sortByOrder: isForward ? Order.ASC : Order.DESC,
      limitTo: limit
    });
  }
}
