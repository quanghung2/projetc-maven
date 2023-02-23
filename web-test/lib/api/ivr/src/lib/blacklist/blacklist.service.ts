import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlockedNumber } from './number-block';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {
  constructor(private http: HttpClient) {}

  fetchBlockedNumbers(workflowUuid: string): Observable<BlockedNumber[]> {
    return this.http
      .get<BlockedNumber[]>(`workflow/private/v1/workflow/${workflowUuid}/blockedNumbers`)
      .pipe(map(res => res.map(blockedNumber => new BlockedNumber(blockedNumber))));
  }

  deleteBlockedNumbers(workflowUuid: string, number: string): Observable<BlockedNumber> {
    return this.http
      .delete<BlockedNumberRes>(`workflow/private/v1/workflow/${workflowUuid}/blockedNumbers/${number}`)
      .pipe(map(result => new BlockedNumber(result)));
  }

  addBlockNumber(workflowUuid: string, number: string): Observable<BlockedNumberRes> {
    const body = {
      numbers: [number]
    };
    return this.http.post<BlockedNumberRes>(`workflow/private/v1/workflow/${workflowUuid}/blockedNumbers`, body);
  }
}

class BlockedNumberRes {
  blockedNumbers: BlockedNumber[];
}
