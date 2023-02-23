import { Injectable } from '@angular/core';
import { EntityStore, StoreConfig } from '@datorama/akita';
import { Application } from './app.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'app_portal-app', idKey: 'appId' })
export class PortalAppStore extends EntityStore<Application> {
  constructor() {
    super();
  }
}
