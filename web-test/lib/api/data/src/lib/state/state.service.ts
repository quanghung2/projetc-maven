import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Queue } from './state.model';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  constructor(private http: HttpClient) {}

  fetchQueueAssignedAgents() {
    return this.http.get<Queue[]>(`data/private/currentState/queue`);
  }
}
