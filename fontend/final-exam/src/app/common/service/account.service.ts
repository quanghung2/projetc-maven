import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../model/account';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(private http: HttpClient) {}
  
  getAll(): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/api/v1/accounts`)
  }


  create(req: Partial<Account>): Observable<void> {
    return this.http.post<void>(`http://localhost:8080/api/v1/accounts`, req)
  }

  update(req: Partial<Account>, id: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/api/v1/accounts/${id}`, req)
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:8080/api/v1/accounts/${id}`)
  }


}
