import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable } from '@datorama/akita';
import { map, tap } from 'rxjs/operators';
import { Organization } from '../organization/organization';
import { ServicedOrganizationStore } from './serviced-organization.store';

@Injectable({ providedIn: 'root' })
export class ServicedOrganizationService {
  constructor(private servicedOrganizationStore: ServicedOrganizationStore, private http: HttpClient) {}

  get() {
    const req$ = this.http.get<Organization[]>(`auth/private/v1/organizations/serviced`).pipe(
      map(entities => entities.map(o => new Organization(o))),
      tap(entities => {
        this.servicedOrganizationStore.set(entities);
      })
    );

    return cacheable(this.servicedOrganizationStore, req$);
  }
}
