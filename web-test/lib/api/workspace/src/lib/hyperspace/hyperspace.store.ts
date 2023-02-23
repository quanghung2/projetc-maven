import { Injectable } from '@angular/core';
import { EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { HyperpsaceUI } from './hyperspace-ui.model';
import { Hyperspace } from './hyperspace.model';

export type HyperspaceState = EntityState<Hyperspace>;

export type HyperspaceUIState = EntityState<HyperpsaceUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_hyperspace', idKey: 'id' })
export class HyperspaceStore extends EntityStore<HyperspaceState> {
  override ui: EntityUIStore<HyperspaceUIState>;

  constructor() {
    super();

    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(<HyperpsaceUI>{
      isExpand: false,
      showAll: false
    });
  }
}
