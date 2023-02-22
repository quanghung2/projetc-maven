import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../model/account';
import { Department } from '../model/department';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/api/v1/departments`);
  }


  create(req: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(`http://localhost:8080/api/v1/departments`, req)
  }

  update(req: Partial<Department>, id: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/api/v1/departments/${id}`, req)
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:8080/api/v1/departments/${id}`)
  }

  addAccount(account: Account, req: Partial<Department>, id: number): Observable<void> {
    return this.http.put<void>(`http://localhost:8080/api/v1/departments/${id}`, req)
  }
}
