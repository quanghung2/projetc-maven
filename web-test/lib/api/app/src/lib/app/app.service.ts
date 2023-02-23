import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, share, tap } from 'rxjs/operators';
import { App, AppDetailResponse, ApplicationV3, GetV3AppReq } from './app';
import { AppStore } from './app.store';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  apps: App[] = [];

  constructor(private http: HttpClient, private store: AppStore) {}

  getV3Apps(req: GetV3AppReq) {
    let params = new HttpParams();
    if (req) {
      Object.keys(req)
        .filter(key => req[key] != null)
        .forEach(key => {
          console.log(req[key]);

          if (key === 'features') {
            params = req.features.length ? params.set('features', req[key].join(',')) : params;
          } else {
            params = params.set(key, req[key]);
          }
        });
    }

    return this.http.get<ApplicationV3[]>(`apps/private/v3/apps`, { params: params }).pipe(
      map(list => list.map(a => new ApplicationV3(a))),
      tap(list => this.store.set(list))
    );
  }

  // Store
  getAppDetailById(appId: string): Observable<AppDetailResponse> {
    return this.http.get<AppDetailResponse>(`/apps/private/v2/application/${appId}`);
  }

  getApp(appId: string) {
    const app = this.apps.find(a => a.appId === appId);
    if (app) {
      return of(app);
    }
    const ob = this.http.get(`apps/private/v2/application/${appId}`).pipe(
      map(res => this.buildAppFromResponse(res)),
      share()
    );

    ob.subscribe(a => this.apps.push(a));
    return ob;
  }

  private buildAppFromResponse(r: any): App {
    const app = new App();
    app.appId = r['appId'];
    app.name = r['name'];
    app.numberConfig = r['numberConfig'];
    app.voiceMode = r['voiceMode'];
    app.iconUrl = r['iconUrl'];

    return app;
  }
}
