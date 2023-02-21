import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../model/account';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  code = 'ZGFuZ2JsYWNrOjEyMzQ1Ng==';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/api/v1/departments/1`)
  }


  create(req: Partial<Account>): Observable<Account> {
    return this.http.post<Account>(`http://localhost:8080/api/v1/departments`, req)
  }

  update(req: Partial<Account>): Observable<Account> {
    return this.http.put<Account>(`http://localhost:8080/api/v1/departments`, req)
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`http://localhost:8080/api/v1/departments`)
  }
}
