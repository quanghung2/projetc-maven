import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoutingConfigModel } from './../model/routing.model';

@Injectable()
export class RoutingService {
  constructor(private http: HttpClient) {}

  getRoutings(sipName: string, keyword = ''): Observable<RoutingConfigModel[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http
      .get<RoutingConfigModel[]>('/appsip/accounts/' + sipName + '/routing', { params: params })
      .pipe(map((res: any[]) => res.map(x => new RoutingConfigModel(x))));
  }

  postRouting(sipName: string, data: any) {
    return this.http
      .post<any>('/appsip/accounts/' + sipName + '/routing', data)
      .pipe(map((res: any) => new RoutingConfigModel(res)));
  }

  deleteRouting(sipName: string, routing: RoutingConfigModel) {
    let params = new HttpParams();
    params = params.set('type', routing.type).set('rule', routing.rule);
    return this.http.delete<any>('/appsip/accounts/' + sipName + '/routing', { params: params });
  }
}
