import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DetectRoutingReq, DetectRoutingRes } from './routing.model';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  constructor(private http: HttpClient) {}

  detectRouting(req: DetectRoutingReq): Observable<DetectRoutingRes> {
    return this.http.post<DetectRoutingRes>(`call/private/v1/routing/rootdetect`, req);
  }
}
