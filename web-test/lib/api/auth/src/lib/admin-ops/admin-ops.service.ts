import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PromoteReq } from './admin-ops';

@Injectable({
  providedIn: 'root'
})
export class AdminOpsService {
  constructor(private http: HttpClient) {}

  promote(req: PromoteReq) {
    return this.http.post<void>(`auth/private/v2/sessiontokens/promote`, req);
  }
}
