import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BookingGroup } from './booking-group';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private bookingGroups: BookingGroup[];

  constructor(private http: HttpClient) {}

  public getBookingGroups() {
    return this.http.get(`workflow/private/v1/booking`);
  }

  public getGroupList(): BookingGroup[] {
    return this.bookingGroups || [];
  }

  public getGroupMap() {
    return _.keyBy(this.getGroupList(), (item: BookingGroup) => {
      return item.uuid;
    });
  }

  public getGroupName(groupUuid: string): string {
    const group: BookingGroup = _.find(this.getGroupMap(), (item: BookingGroup) => {
      return item.uuid === groupUuid;
    });

    if (group) {
      return group.name;
    }

    return undefined;
  }
}
