import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { LoginHistory } from './login-history.model';

@Injectable({
  providedIn: 'root'
})
export class LoginHistoryService {
  constructor(private http: HttpClient) {}

  getLoginHistory(): Observable<LoginHistory> {
    return this.http.get<LoginHistory>(`/data/private/v1/loginHistory`).pipe(map(res => new LoginHistory(res)));
  }
}
