import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestInput, TestInputReq } from './test-flow.model';

@Injectable({
  providedIn: 'root'
})
export class TestFlowService {
  constructor(private http: HttpClient) {}

  executeTestInputs(flowUuid: string, version: number): Observable<TestInput[]> {
    return this.http.get<TestInput[]>(`flow/private/app/v2/test/flows/${flowUuid}/${version}/executeTestInputs`);
  }

  executeTest(flowUuid: string, version: number, body: TestInputReq[]): Observable<number> {
    return this.http
      .post<{ executionId: number }>(`flow/private/app/v2/test/flows/${flowUuid}/${version}/executeTest`, body)
      .pipe(map(data => data.executionId));
  }

  getAvailableNumbers(): Observable<string[]> {
    return this.http
      .get<{ numbers: string[] }>(`flow/private/app/v2/test/utils/availableNumbers`)
      .pipe(map(data => data.numbers));
  }
}
