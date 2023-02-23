import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CreateBulkExtensionJobResp, GetCreateBulkExtensionJobReq, JobDetailResp, JobResp } from './license-job.model';

@Injectable({
  providedIn: 'root'
})
export class LicenseJobService {
  constructor(private http: HttpClient) {}

  createBulkExtensionJob(s3Key: string): Observable<CreateBulkExtensionJobResp> {
    const body = {
      s3Key: s3Key
    };
    return this.http.post<CreateBulkExtensionJobResp>(`license/private/v1/extension/bulk`, body);
  }

  getCreateBulkExtensionJobs(): Observable<JobResp[]> {
    return this.http.get<JobResp[]>(`license/private/v1/extension/bulk/stats`);
  }

  getCreateBulkExtensionJob(
    batchUuid: string,
    requestParams?: GetCreateBulkExtensionJobReq
  ): Observable<JobDetailResp[]> {
    let params = new HttpParams();
    if (requestParams) {
      Object.keys(params).forEach(key => {
        if (requestParams[key]) {
          params.set(key, requestParams[key]);
        }
      });
    }
    return this.http.get<JobDetailResp[]>(`license/private/v1/extension/bulk/${batchUuid}`, { params: params });
  }
}
