import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { User, UserUI } from './user.model';

export interface UserState extends EntityState<User>, ActiveState {
  loaded: boolean; // called fetchAllUsers api
}

export type UserUIState = EntityState<UserUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_user', idKey: 'uuid' })
export class UserStore extends EntityStore<UserState> {
  override ui: EntityUIStore<UserUIState>;
  constructor() {
    super();

    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(
      entity =>
        <UserUI>{
          loadedDetailFromAuth: false,
          loadedTeams: false
        }
    );
  }
}
