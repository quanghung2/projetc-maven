import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TimezoneStore } from './timezone.store';
import { Timezone } from './timezone';
import { cacheable } from '@datorama/akita';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  constructor(private http: HttpClient, private timezoneStore: TimezoneStore) {}

  getTimezone(): Observable<Timezone[]> {
    const request$ = this.http.get<Timezone[]>('/auth/private/v1/timezone').pipe(
      map(res => {
        let temp = this.standardTimezone(res);
        this.timezoneStore.set(temp);
        return temp;
      })
    );
    return cacheable(this.timezoneStore, request$);
  }

  standardTimezone(data: Timezone[]) {
    return data.map(item => {
      return new Timezone(item);
    });
  }
}
