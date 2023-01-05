import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../model/account';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Account> {
    return this.http.get<Account>(`api/v1/accounts`)
  }


  create(req: Partial<Account>): Observable<Account> {
    return this.http.post<Account>(`api/v1/accounts`, req)
  }

  update(req: Partial<Account>): Observable<Account> {
    return this.http.put<Account>(`api/v1/accounts`, req)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`api/v1/accounts`)
  }
}
