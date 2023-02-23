import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Meeting } from './meeting.model';

export interface MeetingState extends EntityState<Meeting> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_meeting' })
export class MeetingStore extends EntityStore<MeetingState> {
  constructor() {
    super();
  }
}
