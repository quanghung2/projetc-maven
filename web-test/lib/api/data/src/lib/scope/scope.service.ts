import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnumScope } from './scope.model';

@Injectable({
  providedIn: 'root'
})
export class ScopeHistoryService {
  constructor(private http: HttpClient) {}

  getScopeUser() {
    return this.http.get<EnumScope[]>('/data/private/v4/scope');
  }
}
