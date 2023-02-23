import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { IsdnNumberState, IsdnNumberStore } from './isdn-number.store';

@Injectable({ providedIn: 'root' })
export class IsdnNumberQuery extends QueryEntity<IsdnNumberState> {
  constructor(protected override store: IsdnNumberStore) {
    super(store);
  }

  selectAssignedNumbers(identityUuid: string) {
    return this.selectAll({
      filterBy: e => e.assignees && e.assignees.indexOf(identityUuid) > -1
    });
  }

  searchISDNNumbersByNumber(number: string) {
    if (number === '') {
      return this.getAll();
    }
    return this.getAll({
      filterBy: e => e.number.indexOf(number) > -1 || `+${e.number}`.indexOf(`+${number}`) > -1
    });
  }
}
