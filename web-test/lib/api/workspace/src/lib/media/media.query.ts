import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { MediaState, MediaStore } from './media.store';

@Injectable({ providedIn: 'root' })
export class MediaQuery extends QueryEntity<MediaState> {
  constructor(protected override store: MediaStore) {
    super(store);
  }

  selectThumbnailsByConvo(convoId: string) {
    return this.selectAll({
      filterBy: entity => entity.convoId === convoId,
      sortBy: 'createdTime',
      sortByOrder: Order.DESC
    });
  }
}
