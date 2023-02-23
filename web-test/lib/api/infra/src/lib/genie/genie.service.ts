import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Flow, GenieExecuteReq, GenieExecuteRes } from './genie.model';

@Injectable({
  providedIn: 'root'
})
export class GenieService {
  constructor(private http: HttpClient) {}

  getFlows(): Observable<Flow[]> {
    return this.http.get<Flow[]>(`cp/private/genie/flows`);
  }

  execute(req: GenieExecuteReq): Observable<GenieExecuteRes> {
    return this.http.post<GenieExecuteRes>(`/cp/private/genie/execute`, req);
  }
}
