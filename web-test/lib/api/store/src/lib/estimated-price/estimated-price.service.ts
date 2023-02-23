import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GetCostStoreBySkusRequest, StoreCost } from '@b3networks/api/store';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EstimatedPriceService {
  constructor(private http: HttpClient) {}

  getCostV2(req: GetCostStoreBySkusRequest[]) {
    return this.http
      .post<StoreCost[]>(`/store/private/v1/estimatedprice`, req)
      .pipe(map(res => res.map(r => new StoreCost(r))));
  }
}
