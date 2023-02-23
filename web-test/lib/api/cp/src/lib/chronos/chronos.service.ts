import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobConfig } from './job-config';

@Injectable({
  providedIn: 'root'
})
export class ChronosService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`cp/private/chronos_wrapper/cat`);
  }

  getJobs(categoryName: string): Observable<JobConfig[]> {
    return this.http.get<JobConfig[]>(`cp/private/chronos_wrapper/cat/${categoryName}/jobs`);
  }

  getJob(categoryName: string, jobName: string) {
    return this.http.get<JobConfig>(`cp/private/chronos_wrapper/cat/${categoryName}/jobs/${jobName}/get`);
  }

  createJob(categoryName: string, jobName: string, req: JobConfig) {
    return this.http.post<void>(`cp/private/chronos_wrapper/cat/${categoryName}/jobs/${jobName}/create`, req);
  }

  cloneJob(categoryName: string, jobName: string, newJobName: string) {
    return this.http.post<void>(
      `cp/private/chronos_wrapper/cat/${categoryName}/jobs/${jobName}/clone/${newJobName}`,
      null
    );
  }

  setJob(categoryName: string, jobName: string, req: JobConfig): Observable<void> {
    return this.http.put<void>(`cp/private/chronos_wrapper/cat/${categoryName}/jobs/${jobName}/update`, req);
  }

  deleteJob(categoryName: string, jobName: string): Observable<void> {
    return this.http.delete<void>(`cp/private/chronos_wrapper/cat/${categoryName}/jobs/${jobName}/delete`);
  }

  runJob(categoryName: string, jobName: string) {
    return this.http.get(`cp/private/chronos_wrapper/cat/${categoryName}/jobs/${jobName}/run`);
  }
}
