import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestLeave, ResponseRequestLeaves } from './request-leave.model';
import { RequestLeaveStore } from './request-leave.store';

@Injectable({
  providedIn: 'root'
})
export class RequestLeaveService {
  constructor(private http: HttpClient, private store: RequestLeaveStore) {}

  getUsersLeaveToday() {
    return this.http.get<ResponseRequestLeaves[]>(`leave/private/v2/users-leave/today`);
  }

  setLeaveRequests(reqs: RequestLeave[]) {
    this.store.set(reqs);
  }
}
