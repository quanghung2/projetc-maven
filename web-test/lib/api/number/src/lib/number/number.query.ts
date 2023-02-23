import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BehaviorSubject } from 'rxjs';
import { NumberState, NumberStore } from './number.store';

@Injectable({ providedIn: 'root' })
export class NumberQuery extends QueryEntity<NumberState> {
  numbers$ = this.selectAll({ sortBy: 'number' });
  numbersChanged$ = new BehaviorSubject<boolean>(true);

  constructor(protected override store: NumberStore) {
    super(store);
  }
}
