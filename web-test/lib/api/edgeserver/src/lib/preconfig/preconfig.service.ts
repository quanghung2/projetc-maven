import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PreConfig } from './preconfig.model';
import { PreConfigStore } from './preconfig.store';

@Injectable({
  providedIn: 'root'
})
export class PreConfigService {
  constructor(private http: HttpClient, private store: PreConfigStore) {}

  getPreConfig(cluster: string): Observable<PreConfig> {
    return this.http.get<PreConfig>(`/edge/private/v1/clusters/${cluster}/config/preconfig`).pipe(
      map(res => new PreConfig(res)),
      tap(res => this.store.update(res))
    );
  }
}
