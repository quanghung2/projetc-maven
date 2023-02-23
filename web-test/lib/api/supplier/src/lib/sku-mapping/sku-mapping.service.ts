import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SkuMapping } from './sku-mapping.model';
import { SkuMappingStore } from './sku-mapping.store';

@Injectable({
  providedIn: 'root'
})
export class SkuMappingService {
  constructor(private http: HttpClient, private store: SkuMappingStore) {}

  getSkuMappings() {
    return this.http.get<SkuMapping[]>(`/supplier/private/v1/mappings`).pipe(tap(res => this.store.set(res)));
  }

  createSkuMapping(data: SkuMapping) {
    return this.http.post<SkuMapping>(`/supplier/private/v1/mappings`, data).pipe(tap(res => this.store.add(res)));
  }

  updateSkuMapping(data: SkuMapping) {
    return this.http
      .put<SkuMapping>(`/supplier/private/v1/mappings/${data.id}`, data)
      .pipe(tap(res => this.store.update(res.id, { ...res })));
  }

  deleteSkuMapping(id: number) {
    return this.http.delete<void>(`/supplier/private/v1/mappings/${id}`).pipe(tap(res => this.store.remove(id)));
  }

  export() {
    return this.http.post(`/supplier/private/v1/mappings/export`, null, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  import(body) {
    return this.http.post<SkuMapping[]>(`/supplier/private/v1/mappings/import`, body);
  }
}
