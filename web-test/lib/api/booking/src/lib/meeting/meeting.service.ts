import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Meeting } from './meeting.model';

@Injectable({
  providedIn: 'root'
})
export class BookingMeetingService {
  constructor(private httpClient: HttpClient) {}

  getMeetings() {
    return this.httpClient.get<Meeting>('/booking/private/app/v1/individual');
  }

  updateMeeting(meeting: Meeting) {
    return this.httpClient.post<Meeting>('/booking/private/app/v1/individual', meeting);
  }

  getMeetingRooms() {
    return this.httpClient.get('/booking/private/app/v1/individual/location');
  }
}
