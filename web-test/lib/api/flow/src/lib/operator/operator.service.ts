import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Operator } from './operator.model';

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  constructor(private http: HttpClient) {}

  getOperators(): Observable<Operator[]> {
    return this.http.get<Operator[]>(`flow/private/app/v1/operators`);
  }
}
