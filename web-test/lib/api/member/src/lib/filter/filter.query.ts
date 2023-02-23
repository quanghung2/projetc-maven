import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Observable } from 'rxjs';
import { MemberStatus } from '../enum';
import { MemberFilter } from './filter.model';
import { MemberFilterStore } from './filter.store';

@Injectable({
  providedIn: 'root'
})
export class MemberFilterQuery extends Query<MemberFilter> {
  constructor(protected override store: MemberFilterStore) {
    super(store);
  }

  selectStatus(): Observable<MemberStatus> {
    return this.select(state => state.status);
  }

  selectSearch(): Observable<string> {
    return this.select(state => state.search);
  }
}
