import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subscription } from './subscription';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  constructor(private http: HttpClient) {}

  getSubscription(): Observable<Subscription> {
    return this.http
      .get<Subscription>(`callcenter/private/v1/admin/subscription`)
      .pipe(map(sub => new Subscription(sub)));
  }
}
