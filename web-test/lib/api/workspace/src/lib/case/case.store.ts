import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { CaseDetail } from './case.model';

export interface CaseState extends EntityState<CaseDetail, number>, ActiveState<number> {
  openCount: number;
  closedCount: number;
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_cases' })
export class CaseStore extends EntityStore<CaseState> {
  constructor() {
    super({ openCount: 0, closedCount: 0, totalCount: 0 });
  }
}
