import { Injectable } from '@angular/core';
import { UUID_V4_REGEX } from '@b3networks/shared/common';
import { CacheMedia } from './cache-media.model';
import { CacheMediaStore } from './cache-media.store';

@Injectable({
  providedIn: 'root'
})
export class CacheMediaService {
  constructor(private store: CacheMediaStore) {}

  add(media: CacheMedia) {
    this.store.remove(media.key);
    this.store.add(media);
  }

  remove(key: string) {
    let s3KeyWithouOrgUuid = key;
    const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
    if (rs && rs.index === 0) {
      s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
    }
    this.store.remove(s3KeyWithouOrgUuid);
  }
}
