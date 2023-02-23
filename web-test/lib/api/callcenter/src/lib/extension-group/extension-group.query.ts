import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ExtensionGroup } from './extension-group.model';
import { ExtensionGroupState, ExtensionGroupStore } from './extension-group.store';

@Injectable({ providedIn: 'root' })
export class ExtensionGroupQuery extends QueryEntity<ExtensionGroupState, ExtensionGroup> {
  constructor(protected override store: ExtensionGroupStore) {
    super(store);
  }
}
