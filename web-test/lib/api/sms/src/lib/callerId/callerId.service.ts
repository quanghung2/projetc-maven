import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateGlobalBlacklistReq } from './callerId.model';

@Injectable({ providedIn: 'root' })
export class CallerIdService {
  constructor(private http: HttpClient) {}

  updateGlobalBlacklist(req: UpdateGlobalBlacklistReq): Observable<string[]> {
    return this.http.put<string[]>(`sms/private/v1/callerId/globalBlacklist`, req);
  }
}
