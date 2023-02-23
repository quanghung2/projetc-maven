import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { IsdnNumber } from './isdn-number.model';

export interface IsdnNumberState extends EntityState<IsdnNumber> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'sim_isdn-number', idKey: 'number' })
export class IsdnNumberStore extends EntityStore<IsdnNumberState> {
  constructor() {
    super();
  }
}
