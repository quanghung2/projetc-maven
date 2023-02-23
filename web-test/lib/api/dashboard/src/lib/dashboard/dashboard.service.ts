import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Dashboard } from './dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  fetchAll() {
    return this.http
      .get<Dashboard[]>(`dashboard/private/v1/dashboards`)
      .pipe(map(list => list.map(dash => new Dashboard(dash))));
  }

  getOne(uuid: string) {
    return this.http.get<Dashboard>(`dashboard/private/v1/dashboards/${uuid}`).pipe(map(dash => new Dashboard(dash)));
  }

  create(dashboard: Dashboard) {
    return this.http
      .post<Dashboard>(`dashboard/private/v1/dashboards`, dashboard)
      .pipe(map(dash => new Dashboard(dash)));
  }

  update(dashboard: Dashboard) {
    return this.http
      .put<Dashboard>(`dashboard/private/v1/dashboards/${dashboard.uuid}`, dashboard)
      .pipe(map(dash => new Dashboard(dash)));
  }

  delete(dashboard: Dashboard) {
    return this.http.delete<void>(`dashboard/private/v1/dashboards/${dashboard.uuid}`);
  }
}
