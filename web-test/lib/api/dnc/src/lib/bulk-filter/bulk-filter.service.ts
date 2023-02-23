import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs';
import { JobBulkFilter, JobBulkFilterReq } from './bulk-filter.model';
import { BulkFilterStore } from './bulk-filter.store';

@Injectable({
  providedIn: 'root'
})
export class BulkFilterService {
  constructor(private http: HttpClient, private store: BulkFilterStore) {}

  createJob(bulkUuid: string, req: JobBulkFilterReq) {
    return this.http.put(`dnc/private/v3/bulkFilter/${bulkUuid}`, req);
  }

  getAllJobCreated() {
    return this.http.get<JobBulkFilter[]>(`dnc/private/v3/bulkFilter`).pipe(
      map(list => list?.map(x => new JobBulkFilter(x))),
      tap(list => this.store.upsertMany(list, { baseClass: JobBulkFilter }))
    );
  }

  getResultBulkFilter(bulkUuid: string) {
    return this.http.get(`dnc/private/v3/bulkFilter/${bulkUuid}/csv`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
