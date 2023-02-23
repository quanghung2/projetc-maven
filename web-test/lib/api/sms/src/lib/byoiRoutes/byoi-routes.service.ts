import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Vendor } from '../vendor/vendor.model';
import { ByoiRoute } from './byoi-routes.model';
import { ByoiRoutesStore } from './byoi-routes.store';

@Injectable({ providedIn: 'root' })
export class ByoiRoutesService {
  constructor(private byoiRoutesStore: ByoiRoutesStore, private http: HttpClient) {}

  getVendors() {
    return this.http.get<Vendor[]>(`/sms/private/v1/vendors/_full`);
  }

  getByoiRoutes() {
    return this.http.get<ByoiRoute[]>(`/sms/private/v1/byoiRoutes`).pipe(
      tap((byoiRoutes: ByoiRoute[]) => {
        this.byoiRoutesStore.set(byoiRoutes);
      })
    );
  }

  createByoiRoutes(body: Partial<ByoiRoute>) {
    return this.http.post<Partial<ByoiRoute>>(`/sms/private/v1/byoiRoutes`, body);
  }

  updateByoiRoutes(id: number, body: Partial<ByoiRoute>) {
    return this.http.put<Partial<ByoiRoute>>(`/sms/private/v1/byoiRoutes/${id}`, body);
  }

  deleteByoiRoutes(id: number) {
    return this.http.delete(`/sms/private/v1/byoiRoutes/${id}`).pipe(
      tap(_ => {
        this.byoiRoutesStore.remove(id);
      })
    );
  }
}
