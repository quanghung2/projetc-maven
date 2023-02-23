import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { filter } from 'rxjs/operators';
import { OrgConfig } from './org-config.model';
import { OrgConfigStore } from './org-config.store';

@Injectable({ providedIn: 'root' })
export class OrgConfigQuery extends Query<OrgConfig> {
  orgConfig$ = this.select().pipe(filter(c => Object.keys(c)?.length > 0));

  busyRemarks$ = this.select('remarks');

  constructor(protected override store: OrgConfigStore) {
    super(store);
  }
}
