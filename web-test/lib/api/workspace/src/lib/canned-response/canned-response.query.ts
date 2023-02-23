import { Injectable } from '@angular/core';
import { contains } from '@b3networks/shared/common';
import { Order, QueryEntity } from '@datorama/akita';
import { ConvoType } from '../enums.model';
import { CannedResponseState, CannedResponseStore } from './canned-response.store';

@Injectable({ providedIn: 'root' })
export class CannedResponseQuery extends QueryEntity<CannedResponseState> {
  isLoading$ = this.selectLoading();
  constructor(protected override store: CannedResponseStore) {
    super(store);
  }

  cannedResponses$ = this.selectAll({
    sortBy: 'name',
    sortByOrder: Order.ASC
  });

  cannedResponsesWhatsapp$ = this.selectAll({
    filterBy: entity => entity.type === ConvoType.whatsapp,
    sortBy: 'name',
    sortByOrder: Order.ASC
  });

  activeCannedResponses$ = this.selectAll({
    filterBy: res => res.status === 'active',
    sortBy: 'name',
    sortByOrder: Order.ASC
  });

  selectEmailCannedResponses$ = this.selectAll({
    filterBy: item => item.type === ConvoType.email,
    sortBy: 'name',
    sortByOrder: Order.ASC
  });

  searchByName(name: string) {
    if (name === '') {
      return this.getAll();
    }

    return this.getAll({
      filterBy: e => contains(e.name, name)
    });
  }
}
