import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChurnService {
  constructor(private http: HttpClient) {}

  setReason(subscriptionUuid: string, reason: string): Observable<void> {
    return this.http.post<void>(`/churn/private/v1/reasons`, { subscriptionUuid, reason });
  }
}
