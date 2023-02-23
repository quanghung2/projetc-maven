import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Meeting } from './meeting.model';
import { MeetingStore } from './meeting.store';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  constructor(private httpClient: HttpClient, protected store: MeetingStore) {}

  getMeetings() {
    return this.httpClient.get<Meeting[]>(`/workspace/private/etc/v1/meetings`).pipe(
      map(meeting => {
        return meeting.map(meeting => new Meeting(meeting));
      }),
      tap(meeting => {
        this.store.set(meeting);
      })
    );
  }

  createMeeting() {
    return this.httpClient.post<Meeting>(`/workspace/private/etc/v1/meetings`, null).pipe(
      map(meeting => new Meeting(meeting)),
      tap(meeting => {
        this.store.add(meeting);
      })
    );
  }

  deleteMeeting(id: number) {
    return this.httpClient.delete<void>(`/workspace/private/etc/v1/meetings/${id}`).pipe(
      tap(_ => {
        this.store.remove(id);
      })
    );
  }

  checkJoinMeeting(id: number) {
    return this.httpClient.put<void>(`/workspace/private/etc/v1/meetings/${id}`, null);
  }
}
