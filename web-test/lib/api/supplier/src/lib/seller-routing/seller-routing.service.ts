import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CreateRoutingReq, SellerRouting } from './seller-routing.model';
import { SellerRoutingStore } from './seller-routing.store';

@Injectable({
  providedIn: 'root'
})
export class SellerRoutingService {
  constructor(private http: HttpClient, private store: SellerRoutingStore) {}

  getSellerRouting(): Observable<SellerRouting[]> {
    return this.http.get<SellerRouting[]>(`/supplier/private/v1/seller/routing`).pipe(
      map(res => {
        return res.map(res => new SellerRouting(res));
      }),
      tap(res => this.store.set(res))
    );
  }

  createSellerRouting(data: CreateRoutingReq) {
    return this.http.post<SellerRouting>(`/supplier/private/v1/seller/routing`, data).pipe(
      map(res => new SellerRouting(res)),
      tap(res => {
        this.store.add(res);
      })
    );
  }

  updateSellerRouting(data: CreateRoutingReq) {
    let body = { supplierUuid: data.supplierUuid };
    return this.http.put<SellerRouting>(`/supplier/private/v1/seller/routing/${data.orgUuid}/${data.type}`, body).pipe(
      map(res => new SellerRouting(res)),
      tap(res => {
        this.store.update(res.id, { ...res });
      })
    );
  }

  deleteSellerRouting(data: SellerRouting) {
    return this.http
      .delete<void>(`/supplier/private/v1/seller/routing/${data.orgUuid}/${data.type}`)
      .pipe(tap(res => this.store.remove(data.id)));
  }

  updateDefaultSupplier(supplierUuid: string) {
    const body = { supplierUuid: supplierUuid };
    return this.http.put(`/supplier/private/v1/seller/defaultSupplier`, body);
  }
}
