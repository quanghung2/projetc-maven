import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IAMGrantedPermission, IAMGroup } from '../iam/iam.model';

export interface MeIamState extends EntityState<IAMGrantedPermission> {
  iamGroups: IAMGroup[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_me-iam', idKey: 'id' })
export class MeIamStore extends EntityStore<MeIamState> {
  constructor() {
    super({
      iamGroups: []
    });
  }
}
