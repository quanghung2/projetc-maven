import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssignedNumber, ExtensionNumber } from './number';

@Injectable({
  providedIn: 'root'
})
export class NumberService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<ExtensionNumber[]>(`callcenter/private/v3/number/list`);
  }

  getAssignedNumbersByExtKey(extKey: string): Observable<string[]> {
    return this.http.get<string[]>(`callcenter/private/v3/extension/${extKey}/assignedNumber`);
  }

  getAssignedNumbersByExtKeyV4(extKey: string): Observable<AssignedNumber[]> {
    return this.http.get<AssignedNumber[]>(`callcenter/private/v4/extension/${extKey}/assignedNumber`);
  }
}
