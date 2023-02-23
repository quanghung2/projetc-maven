import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { IAMGrantedPermission, IAMGroup, IAMPermission } from './iam.model';
import { IAMMember } from '@b3networks/api/auth';

export interface IamState {
  allPermissions: IAMPermission[];
  groups: IAMGroup[];
  member: IAMMember;
  actions: IAMGrantedPermission[];
}

export function createInitialState(): IamState {
  return {} as IamState;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_iam' })
export class IamStore extends Store<IamState> {
  constructor() {
    super(createInitialState());
  }
}
