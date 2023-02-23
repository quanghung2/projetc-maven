import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PortalData } from './portal.model';
import { PortalStore } from './portal.store';

@Injectable({ providedIn: 'root' })
export class PortalQuery extends Query<PortalData> {
  orgBackground$ = this.select('orgBackground');

  constructor(protected override store: PortalStore) {
    super(store);
  }
}
