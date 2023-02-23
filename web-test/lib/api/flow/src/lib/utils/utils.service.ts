import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExtractJsonPropRes, Output } from '../common.model';
import { ExtendOutput } from '../flow/trigger/trigger.model';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private http: HttpClient) {}

  extractJsonProps(req: string): Observable<ExtractJsonPropRes[]> {
    return this.http.post<ExtractJsonPropRes[]>(
      `flow/private/app/v1/utils/extractJsonProps?location=body`,
      JSON.parse(req)
    );
  }

  extractExtendTriggerOutput(req: string): Observable<ExtendOutput[]> {
    return this.http.post<ExtendOutput[]>(
      `flow/private/app/v1/utils/extract-extended-trigger-outputs`,
      JSON.parse(req)
    );
  }

  extractCustomActionResponse(req: string): Observable<Output[]> {
    return this.http.post<Output[]>(`flow/private/app/v1/utils/extract-custom-action-response`, JSON.parse(req));
  }
}
