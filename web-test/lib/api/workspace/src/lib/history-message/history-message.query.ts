import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ChatMessage } from '../chat/chat-message.model';
import { ConvoType, MsgType } from '../enums.model';
import { HistoryMessageState, HistoryMessageStore } from './history-message.store';
@Injectable({ providedIn: 'root' })
export class HistoryMessageQuery extends QueryEntity<HistoryMessageState> {
  isLoading$ = this.selectLoading();

  constructor(protected override store: HistoryMessageStore) {
    super(store);
  }

  selectAllByConversation(convoUuid: string): Observable<ChatMessage[]> {
    return this.selectAll({
      filterBy: entity => entity.convo === convoUuid,
      sortBy: 'ts',
      sortByOrder: Order.ASC
    });
  }

  selectMsgByListConvo(convoUuids: string[]) {
    return this.selectAll({
      filterBy: entity => convoUuids.indexOf(entity.convo) > -1,
      sortBy: 'ts',
      sortByOrder: Order.ASC
    });
  }

  selectActiveCallMessage(): Observable<ChatMessage> {
    return this.selectActive().pipe(filter(msg => msg != null && msg.ct === ConvoType.call));
  }

  getlastestMsgByUser(convoId: string, userUuid: string) {
    return this.getAll({
      filterBy: entity => entity.convo === convoId && entity.user === userUuid && entity.mt === MsgType.message,
      sortBy: 'ts',
      sortByOrder: Order.DESC,
      limitTo: 1
    });
  }

  getlastestMsg(convoId: string) {
    return this.getAll({
      filterBy: entity => entity.convo === convoId && entity.isStore && !entity?.metadata?.deletedAt,
      sortBy: 'ts',
      sortByOrder: Order.DESC,
      limitTo: 1
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
