import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, first, map, tap } from 'rxjs/operators';
import { ConfigStaticDataSource } from '../common.model';
import { DataSourceForSubroutine, GetDataSourceReq } from './data-source.model';
import { DataSourceQuery } from './data-source.query';
import { DataSourceStore } from './data-source.store';

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {
  constructor(
    private http: HttpClient,
    private dataSourceStore: DataSourceStore,
    private dataSourceQuery: DataSourceQuery
  ) {}

  getDataSources(): Observable<DataSourceForSubroutine[]> {
    return this.http
      .get<DataSourceForSubroutine[]>(`/flow/private/app/v1/dataSources`)
      .pipe(map(lst => lst.map(dts => new DataSourceForSubroutine(dts))));
  }

  fetchSelections(req: GetDataSourceReq): Observable<ConfigStaticDataSource[]> {
    if (!this.dataSourceStore.getValue().entities[req.dataSourceUuid]?.data?.length) {
      return this.http
        .post<ConfigStaticDataSource[]>(`/flow/private/app/v1/dataSources/${req.dataSourceUuid}/fetchSelections`, {
          flowUuid: req.flowUuid,
          flowVersion: req.flowVersion
        })
        .pipe(
          tap(dataSources => {
            this.dataSourceStore.upsert(req.dataSourceUuid, { uuid: req.dataSourceUuid, data: dataSources });
          })
        );
    } else {
      return this.dataSourceQuery.selectDataSource(req.dataSourceUuid).pipe(debounceTime(300), first());
    }
  }

  reset() {
    this.dataSourceStore.reset();
  }
}
