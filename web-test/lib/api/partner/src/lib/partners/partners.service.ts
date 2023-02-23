import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable } from '@datorama/akita';
import { tap } from 'rxjs/operators';
import { Partner } from '../partner/partner.model';
import { PartnersStore } from './partners.store';

@Injectable({
  providedIn: 'root'
})
export class PartnersService {
  constructor(private http: HttpClient, private store: PartnersStore) {}

  getAllPartners(addon?: { forceLoad: boolean }) {
    const req$ = this.http.get<Partner[]>(`/partner/cp/v1/domains`).pipe(
      tap(data => {
        this.store.set(data);
        this.store.setHasCache(true);
      })
    );

    if (addon?.forceLoad) {
      return req$;
    }

    return cacheable(this.store, req$);
  }
}
