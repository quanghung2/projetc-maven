import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { FileDetail } from './media.model';

export interface MediaState extends EntityState<FileDetail> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'file_list', idKey: 'mediaId' })
export class MediaStore extends EntityStore<MediaState> {
  constructor() {
    super();
  }
}
