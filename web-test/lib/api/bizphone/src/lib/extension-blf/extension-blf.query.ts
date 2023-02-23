import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ExtensionBLF } from './extension-blf.model';
import { ExtensionBLFState, ExtensionBLFStore } from './extension-blf.store';

@Injectable({ providedIn: 'root' })
export class ExtensionBLFQuery extends QueryEntity<ExtensionBLFState, ExtensionBLF> {
  constructor(protected override store: ExtensionBLFStore) {
    super(store);
  }
}
