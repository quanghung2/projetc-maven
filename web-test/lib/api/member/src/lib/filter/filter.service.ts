import { Injectable } from '@angular/core';
import { MemberFilter } from './filter.model';
import { MemberFilterStore } from './filter.store';

@Injectable({
  providedIn: 'root'
})
export class MemberFilterService {
  constructor(private store: MemberFilterStore) {}

  updateFilter(filter: Partial<MemberFilter>) {
    this.store.update(state => ({ ...state, ...filter }));
  }
}
