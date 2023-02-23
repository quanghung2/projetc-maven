import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Report } from './reports.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  constructor(private http: HttpClient) {}

  getReports(date?: string): Observable<Report[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<Report[]>(`e2etesting/private/v1/reports`, { params });
  }
}
