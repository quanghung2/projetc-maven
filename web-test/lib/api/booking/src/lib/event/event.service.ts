import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BookingEvent, BookingEventV2, MemberBooking } from './event.model';
import { EventBookingStore } from './event.store';

@Injectable({ providedIn: 'root' })
export class EventBookingService {
  constructor(private store: EventBookingStore, private http: HttpClient) {}
  mock: BookingEvent[] = [
    {
      id: 'n064qQJjk7',
      startTime: 1624523400000,
      endTime: 1624525200000,
      status: 'SCHEDULED',
      description: 'Luan test event with Luan  ',
      inviteeInfo: {
        firstName: 'Luan',
        lastName: '',
        middleName: '',
        phoneNumber: '0398460989',
        email: 'luan@hoiio.com'
      }
    },
    {
      id: 'n064qQJjk7',
      startTime: 1624523400000,
      endTime: 1624525200000,
      status: 'SCHEDULED',
      description: 'Luan test event with Luan  ',
      inviteeInfo: {
        firstName: 'Luan',
        lastName: '',
        middleName: '',
        phoneNumber: '0398460989',
        email: 'luan@hoiio.com'
      }
    },
    {
      id: 'n064qQJjk7',
      startTime: 1624523400000,
      endTime: 1624525200000,
      status: 'SCHEDULED',
      description: 'Luan test event with Luan  ',
      inviteeInfo: {
        firstName: 'Luan',
        lastName: '',
        middleName: '',
        phoneNumber: '0398460989',
        email: 'luan@hoiio.com'
      }
    },
    {
      id: 'n064qQJjk1',
      startTime: 1624523400000 + 24 * 60 * 60 * 1000,
      endTime: 1624525200000 + 24 * 60 * 60 * 1000,
      status: 'SCHEDULED',
      description: 'Luan test event with Luan  ',
      inviteeInfo: {
        firstName: 'Luan',
        lastName: '',
        middleName: '',
        phoneNumber: '0398460989',
        email: 'luan@hoiio.com'
      }
    },
    {
      id: 'n064qQJjk5',
      startTime: 1624333807404 + 60 * 1000,
      endTime: 1624333807404 + 90 * 1000,
      status: 'SCHEDULED',
      description: 'Luan test event with Luan  ',
      inviteeInfo: {
        firstName: 'Luan',
        lastName: '',
        middleName: '',
        phoneNumber: '0398460989',
        email: 'luan@hoiio.com'
      }
    }
  ];

  getBookingUpcoming() {
    const params = new HttpParams().append('status', 'active').append('timeType', 'upcoming');
    return this.http
      .get<BookingEvent[]>('/booking/private/v1/events', { params })
      .pipe(
        tap(events => {
          events.sort((a, b) => a.startTime - b.startTime);
          // this.mock.sort((a, b) => a.startTime - b.startTime);
          this.store.upsertMany(events, { baseClass: BookingEvent });
        })
      );
  }

  getUpcomingEvents(): Observable<BookingEventV2[]> {
    return this.http
      .get<BookingEventV2[]>(`/booking/private/app/v1/events/upcoming`)
      .pipe(map(res => res.map(r => new BookingEventV2(r))));
  }

  getPastEvents(days: number): Observable<BookingEventV2[]> {
    let params = new HttpParams();
    params = params.set('days', days + '');

    return this.http
      .get<BookingEventV2[]>(`/booking/private/app/v1/events/past`, { params })
      .pipe(map(res => res.map(r => new BookingEventV2(r))));
  }

  getEventsInDateRange(timezone: string, startDate: string, endDate: string): Observable<BookingEventV2[]> {
    let params = new HttpParams();
    if (!!timezone) {
      params = params.set('timezone', timezone);
    }
    if (!!startDate) {
      params = params.set('startDate', startDate);
    }
    if (!!endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http
      .get<BookingEventV2[]>(`/booking/private/app/v1/events/daterange`, { params })
      .pipe(map(res => res.map(r => new BookingEventV2(r))));
  }

  assign(uniqueId: string, assigneeIdentityUuid: string) {
    return this.http.post(`/booking/private/app/v1/events/${uniqueId}/assign`, { assigneeIdentityUuid });
  }

  cancel(uniqueId: string, request: {}) {
    return this.http.post(`/booking/private/app/v1/events/${uniqueId}/cancel`, request);
  }

  findAssignableMembers(uniqueId: string, keyword?: string, page?: number, size?: number): Observable<MemberBooking[]> {
    let params = new HttpParams();
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    params = params.set('page', !!page ? page.toString() : '0');
    params = params.set('size', !!size ? size.toString() : '20');

    return this.http
      .get<MemberBooking[]>(`/booking/private/app/v1/events/${uniqueId}/assignableMembers`, { params })
      .pipe(map(res => res.map(r => new MemberBooking(r))));
  }
}
