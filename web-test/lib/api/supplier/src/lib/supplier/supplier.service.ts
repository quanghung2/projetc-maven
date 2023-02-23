import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CreateRoutingReq, SellerRouting } from '../seller-routing/seller-routing.model';
import { SkuMapping } from '../sku-mapping/sku-mapping.model';
import {
  CreatePlanReq,
  Plan,
  Seller,
  SetDefaultSupplierForAdminReq,
  Supplier,
  UpdateMappingRefReq
} from './supplier.model';
import { SupplierStore } from './supplier.store';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  constructor(private http: HttpClient, private store: SupplierStore) {}

  getSuppliers() {
    return this.http.get<Supplier[]>(`/supplier/private/v1/admin/suppliers`).pipe(
      map(res => res.map(res => new Supplier(res))),
      tap(res => this.store.set(res))
    );
  }

  getSeller() {
    return this.http.get<Seller>(`/supplier/private/v1/seller`);
  }

  getPlans(stack: string): Observable<Plan[]> {
    const params = new HttpParams().set('stack', stack);
    return this.http.get<Plan[]>(`/supplier/private/v1/admin/routing`, { params: params });
  }

  createPlan(req: CreatePlanReq): Observable<void> {
    return this.http.post<void>(`/supplier/private/v1/admin/routing`, req);
  }

  createSuplier(data: Supplier) {
    return this.http.post<Supplier>(`/supplier/private/v1/admin/suppliers`, data).pipe(
      map(res => new Supplier(res)),
      tap(res => this.store.add(res))
    );
  }

  updateSuplier(data: Supplier) {
    return this.http.put<Supplier>(`/supplier/private/v1/admin/suppliers/${data.partnerUuid}`, data).pipe(
      map(res => new Supplier(res)),
      tap(res => this.store.update(res.id, { ...res }))
    );
  }

  getMappingReference(supplierUuid: string): Observable<SkuMapping[]> {
    const params = new HttpParams().set('supplierUuid', supplierUuid);
    return this.http.get<SkuMapping[]>(`/supplier/private/v1/admin/mappings/reference`, { params: params });
  }

  updateMappingReference(req: UpdateMappingRefReq): Observable<void> {
    return this.http.post<void>(`/supplier/private/v1/admin/mappings/reference`, req);
  }

  getDefaultSupplier(partnerUuid: string): Observable<Seller> {
    return this.http.get<Seller>(`/supplier/private/v1/admin/partner/${partnerUuid}`);
  }

  updateDefaultSupplier(partnerUuid: string, req: SetDefaultSupplierForAdminReq): Observable<void> {
    return this.http.put<void>(`/supplier/private/v1/admin/partner/${partnerUuid}`, req);
  }

  getSellerRouting(sellerUuid: string): Observable<SellerRouting[]> {
    return this.http.get<SellerRouting[]>(`/supplier/private/v1/admin/seller/${sellerUuid}/routing`);
  }

  createSellerRouting(sellerUuid: string, req: CreateRoutingReq): Observable<SellerRouting> {
    return this.http.post<SellerRouting>(`/supplier/private/v1/admin/seller/${sellerUuid}/routing`, req);
  }

  updateSellerRouting(sellerUuid: string, req: CreateRoutingReq): Observable<SellerRouting> {
    return this.http.put<SellerRouting>(
      `/supplier/private/v1/admin/seller/${sellerUuid}/routing/${req.orgUuid}/${req.type}`,
      {
        supplierUuid: req.supplierUuid
      }
    );
  }

  deleteSellerRouting(sellerUuid: string, req: CreateRoutingReq): Observable<void> {
    return this.http.delete<void>(`/supplier/private/v1/admin/seller/${sellerUuid}/routing/${req.orgUuid}/${req.type}`);
  }
}
