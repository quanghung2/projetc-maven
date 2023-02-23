import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { StaffExtensionState, StaffExtensionStore } from './staff-extension.store';

@Injectable({ providedIn: 'root' })
export class StaffExtensionQuery extends QueryEntity<StaffExtensionState> {
  constructor(protected override store: StaffExtensionStore) {
    super(store);
  }

  selectByIdentity(identityUuid: string) {
    return this.selectEntity(identityUuid);
  }

  selectExtByIdentity(identityUuid: string) {
    return this.selectEntity(identityUuid, 'extension');
  }

  getExtByIdentity(identityUuid: string) {
    return this.getEntity(identityUuid)?.extension;
  }

  getByIdentity(identityUuid: string) {
    return this.getEntity(identityUuid);
  }

  getExtByKey(extKey: string) {
    return this.getAll({
      filterBy: entity => {
        return entity?.extension?.extKey === extKey;
      },
      limitTo: 1
    });
  }
}
