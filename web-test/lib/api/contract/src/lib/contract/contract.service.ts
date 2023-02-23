import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Contract } from './contract.model';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  constructor(private http: HttpClient) {}

  getContracts(buyerUuid: string): Observable<Contract[]> {
    const params = new HttpParams().set('buyerUuid', buyerUuid);

    return this.http
      .get<Contract[]>('/contract/private/v1/contracts/active', { params })
      .pipe(map(contracts => contracts.map(contract => new Contract(contract))));
  }
}
