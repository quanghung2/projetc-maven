import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Injectable({
  providedIn: 'root'
})
export class PagingService {
  constructor() {}

  getPagedLoginSessions<T>(pageOffset: number, pageStart: number, dataSource: MatTableDataSource<T>) {
    const startIdx = pageStart * pageOffset - pageOffset;
    const endIdx = startIdx + pageOffset;
    const pagedData = new MatTableDataSource<T>();
    pagedData.data = dataSource.data.slice(startIdx, endIdx);

    return pagedData;
  }
}
