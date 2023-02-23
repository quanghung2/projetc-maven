import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_PREFIX } from '@b3networks/shared/common';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export let TIME_OFFSET = 0;

export const getTimeFromChatServer = () => {
  const now = new Date().valueOf();
  return now + TIME_OFFSET;
};

@Injectable({
  providedIn: 'root'
})
export class TimeService {
  timeOffset = 0;
  private _done$ = new BehaviorSubject<boolean>(false); // check finalize api

  get done$() {
    return this._done$.asObservable();
  }

  constructor(private http: HttpClient) {}

  nowInMillis() {
    const now = new Date().valueOf();
    return now + this.timeOffset;
  }

  getTsTime() {
    return this.http.get<{ ts: number }>(`${CHAT_PUBLIC_PREFIX}/timestamp`).pipe(
      map((x: { ts: number }) => x.ts),
      tap((t: number) => {
        if (t > 0) {
          const now = new Date().valueOf();
          this.timeOffset = t - now;
          TIME_OFFSET = t - now;
          this._done$.next(true);
        }
      })
    );
  }
}
