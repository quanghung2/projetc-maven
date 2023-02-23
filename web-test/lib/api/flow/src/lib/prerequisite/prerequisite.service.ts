import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InvalidConnector, PrerequisiteStore } from './prerequisite.store';

@Injectable({
  providedIn: 'root'
})
export class PrerequisiteService {
  constructor(private http: HttpClient, private store: PrerequisiteStore) {}

  getPrerequisites(): Observable<InvalidConnector> {
    return this.http.get<InvalidConnector>(`flow/private/app/v1/prerequisite`).pipe(tap(res => this.store.update(res)));
  }
}
