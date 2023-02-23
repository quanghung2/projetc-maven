import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { CaseMetaData } from './cases-metadata.model';
import { CaseMetaDataStore } from './cases-metadata.store';

@Injectable({
  providedIn: 'root'
})
export class SCMetaDataService {
  constructor(private httpClient: HttpClient, private store: CaseMetaDataStore) {}

  getCaseMetadata() {
    return this.httpClient.get<CaseMetaData>(`support-center/private/v3/metadata`).pipe(
      tap(metadata => {
        this.store.update({ ...metadata, loaded: true });
        this.store.setLoading(false);
      })
    );
  }
}
