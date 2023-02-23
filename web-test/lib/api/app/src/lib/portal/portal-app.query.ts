import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Application } from './app.model';
import { PortalAppStore } from './portal-app.store';

@Injectable({ providedIn: 'root' })
export class PortalAppQuery extends QueryEntity<Application> {
  applications$ = this.selectAll();

  constructor(protected override store: PortalAppStore) {
    super(store);
  }
}
