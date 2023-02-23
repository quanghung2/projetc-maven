import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Extension } from './model/extension.model';

export interface ExtensionState extends EntityState<Extension> {
  ui: {
    unassignedOnly: boolean;
    q: string;
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'bizphone_extension', idKey: 'extKey' })
export class ExtensionStore extends EntityStore<ExtensionState> {
  constructor() {
    super({ ui: { unassignedOnly: false, q: '' } });
  }

  updateUI(ui: any) {
    this.update(state => ({
      ui: {
        ...state.ui,
        ...ui
      }
    }));
  }
}
