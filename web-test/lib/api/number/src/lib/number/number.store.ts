import { Injectable } from '@angular/core';
import { EntityState, EntityStore, MultiActiveState, StoreConfig } from '@datorama/akita';
import { B3Number } from './number.model';

export interface NumberState extends EntityState<B3Number>, MultiActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'number_numbers', idKey: 'number' })
export class NumberStore extends EntityStore<NumberState> {
  constructor() {
    super();
  }
}
