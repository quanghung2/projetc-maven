import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SkillCatalogState, SkillCatalogStore } from './skill-catalog.store';

@Injectable({ providedIn: 'root' })
export class SkillCatalogQuery extends QueryEntity<SkillCatalogState> {
  skillsStore$ = this.selectAll();
  constructor(protected override store: SkillCatalogStore) {
    super(store);
  }
}
