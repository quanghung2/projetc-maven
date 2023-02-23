import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { EnumTypeAction, SkillCatalog } from './skill-catalog.model';

export interface SkillCatalogState extends EntityState<SkillCatalog>, ActiveState {
  ui: {
    type: EnumTypeAction.FIRE_THEN_FORGET;
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'intelligence', idKey: 'code' })
export class SkillCatalogStore extends EntityStore<SkillCatalogState> {
  constructor() {
    super({
      ui: {
        type: EnumTypeAction.FIRE_THEN_FORGET
      }
    });
  }
}
