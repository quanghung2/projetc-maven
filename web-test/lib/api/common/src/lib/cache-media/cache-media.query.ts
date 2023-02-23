import { Injectable } from '@angular/core';
import { UUID_V4_REGEX } from '@b3networks/shared/common';
import { QueryEntity } from '@datorama/akita';
import { CachedMediaState, CacheMediaStore } from './cache-media.store';

@Injectable({ providedIn: 'root' })
export class CacheMediaQuery extends QueryEntity<CachedMediaState> {
  private _MAX_EXPIRED = 5 * 60 * 1000;

  constructor(protected override store: CacheMediaStore) {
    super(store);
  }

  getMediaByKey(key: string, isCheckIgnoreOrgUuid: boolean) {
    let s3KeyWithouOrgUuid = key;
    if (isCheckIgnoreOrgUuid) {
      const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
      if (rs && rs.index === 0) {
        s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
      }
    }

    const media = this.getEntity(s3KeyWithouOrgUuid);
    if (!media) {
      return null;
    }

    if (!!media?.time && media.time <= Date.now() - this._MAX_EXPIRED) {
      this.store.remove(s3KeyWithouOrgUuid);
      return null;
    }

    return media;
  }
}
