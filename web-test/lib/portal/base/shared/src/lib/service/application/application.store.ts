import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, HashMap, StoreConfig } from '@datorama/akita';
import { PortalApplication } from './application.model';

export interface ApplicationState extends EntityState<PortalApplication>, ActiveState {
  loadedOrgs: string[];
  renderingApp: boolean;
  lastActiveApps: HashMap<string>;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'application', idKey: 'id', resettable: true })
export class ApplicationStore extends EntityStore<ApplicationState> {
  constructor() {
    super({ loadedOrgs: [], lastActiveApps: {} });
  }

  updateRendering(value: boolean) {
    this.update({ renderingApp: value });
  }
}

export function _sortMenuFunc(a: PortalApplication, b: PortalApplication) {
  const ordering = a.order > -1 && b.order > -1 ? a.order - b.order : a.order > -1 ? -1 : b.order - 1 ? 1 : 0;
  return !ordering ? a.portalAppPath.localeCompare(b.portalAppPath) : ordering;
}
