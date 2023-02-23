import { Injectable } from '@angular/core';
import { ID, QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { ExtensionState, ExtensionStore } from './extension.store';

@Injectable({ providedIn: 'root' })
export class ExtensionQuery extends QueryEntity<ExtensionState> {
  me$ = this.select().pipe(map(s => s.me));

  allExtensions$ = this.selectAll();

  allAssignedExtensions$ = this.selectAll({ filterBy: e => !!e.identityUuid });

  constructor(protected override store: ExtensionStore) {
    super(store);
  }

  selectExtension(extKey: string) {
    return this.selectEntity(extKey);
  }

  selectExtensionByUser(userID: string) {
    return this.selectEntity(e => e.identityUuid === userID);
  }

  selectAllowedCallerIdsForExt(extKey: ID) {
    return this.select('allowedCallerIds').pipe(map(data => data[extKey]));
  }

  selectDelegatedCallerIdsForExt(extKey: ID) {
    return this.select('delegatedCallerIds').pipe(map(data => data[extKey]));
  }

  getExtensionByKey(extKey: ID) {
    return this.getEntity(extKey);
  }

  getExtensionByUser(userId: string) {
    return this.getAll().find(e => e.identityUuid === userId);
  }

  selectExtByText(searchValue: string) {
    return this.selectAll({
      filterBy: entity =>
        entity.extKey?.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0 ||
        entity.extLabel?.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0
    });
  }
}
