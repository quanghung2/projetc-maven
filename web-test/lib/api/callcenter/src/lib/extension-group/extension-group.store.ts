import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ExtensionGroup } from './extension-group.model';

export interface ExtensionGroupState extends EntityState<ExtensionGroup>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_extension-group', idKey: 'extKey' })
export class ExtensionGroupStore extends EntityStore<ExtensionGroupState, ExtensionGroup> {
  constructor() {
    super();
  }
}
