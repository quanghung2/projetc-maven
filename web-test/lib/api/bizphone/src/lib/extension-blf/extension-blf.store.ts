import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ExtensionBLF } from './extension-blf.model';

export interface ExtensionBLFState extends EntityState<ExtensionBLF>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'bizphone_extension-blf', idKey: 'monitorExtKey' })
export class ExtensionBLFStore extends EntityStore<ExtensionBLFState, ExtensionBLF> {
  constructor() {
    super();
  }
}
