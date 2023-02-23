import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CallerIdService {
  constructor(private http: HttpClient) {}

  getAll(assignedNumberOnly?: boolean): Observable<string[]> {
    let params = new HttpParams();
    if (assignedNumberOnly != null) {
      params = params.set('isAssignedNumber', String(assignedNumberOnly));
    }
    return this.http.get<string[]>(`/callcenter/private/v3/callerId`, {
      params: params
    });
  }
}
