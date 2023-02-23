import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SharedVariable {
  flowUuid: string;
  flowName: string;
  collectionVarNames: string[];
  nonCollectionVarNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SharedVariableService {
  constructor(private http: HttpClient) {}

  getSharedVariables(): Observable<SharedVariable[]> {
    return this.http.get<SharedVariable[]>(`flow/private/app/v2/sharedVariables`);
  }
}
