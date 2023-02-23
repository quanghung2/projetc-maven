import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { MemberStatus } from '../enum';
import { MemberFilter } from './filter.model';

export function createInitialState(): MemberFilter {
  return {
    status: MemberStatus.ACTIVE,
    search: ''
  };
}

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'member_filter' })
export class MemberFilterStore extends Store<MemberFilter> {
  constructor() {
    super(createInitialState());
  }
}
