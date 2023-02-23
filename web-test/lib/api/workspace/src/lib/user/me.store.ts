import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { User } from './user.model';

export interface MeState {
  me: User;
}

export function createInitialState(): MeState {
  return {
    me: null
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_me' })
export class MeStore extends Store<MeState> {
  constructor() {
    super(createInitialState());
  }
}
