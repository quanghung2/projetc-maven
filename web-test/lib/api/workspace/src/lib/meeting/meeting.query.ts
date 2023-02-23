import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { MeetingState, MeetingStore } from './meeting.store';

@Injectable({ providedIn: 'root' })
export class MeetingQuery extends QueryEntity<MeetingState> {
  meetings$ = this.selectAll();

  constructor(protected override store: MeetingStore) {
    super(store);
  }
}
