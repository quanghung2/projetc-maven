import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ByoiRoute } from './byoi-routes.model';

export interface ByoiRouteState extends EntityState<ByoiRoute>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'byoiRoutes', idKey: 'id' })
export class ByoiRoutesStore extends EntityStore<ByoiRouteState> {
  constructor() {
    super({});
  }
}
