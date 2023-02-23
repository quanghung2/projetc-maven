import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CannedResponse, CannedResponseRequest } from './canned-response.model';
import { CannedResponseStore } from './canned-response.store';

@Injectable({
  providedIn: 'root'
})
export class CannedResponseService {
  baseURL = 'workspace/private/v1/';
  constructor(private httpClient: HttpClient, private store: CannedResponseStore) {}

  getCannedResponse(): Observable<CannedResponse[]> {
    return this.httpClient.get<CannedResponse[]>(this.baseURL + 'whatsapp/cannedresponses').pipe(
      map(responses => responses.map(response => new CannedResponse(response))),
      tap(responses => {
        this.store.setLoading(true);
        this.store.upsertMany(responses);
      })
    );
  }

  updateCannedResponse(response: CannedResponse) {
    return this.httpClient
      .put<CannedResponse>(this.baseURL + `/whatsapp/cannedresponses/${response.id}`, response)
      .pipe(
        tap(responses => {
          this.store.setLoading(true);
          this.store.update(responses);
        })
      );
  }

  createCannedResponse(req: CannedResponseRequest) {
    return this.httpClient.post<CannedResponse>(this.baseURL + 'whatsapp/cannedresponses/organization', req).pipe(
      map(res => new CannedResponse(res)),
      tap(res => {
        this.store.setLoading(true);
        this.store.add(res);
      })
    );
  }

  deleteCannedResponse(id: string) {
    return this.httpClient.delete<CannedResponse>(this.baseURL + `/whatsapp/cannedresponses/${id}`).pipe(
      tap(_ => {
        this.store.setLoading(true);
        this.store.remove(id);
      })
    );
  }

  getEmailCannedResponse(): Observable<CannedResponse[]> {
    return this.httpClient.get<CannedResponse[]>(this.baseURL + 'emails/cannedresponses').pipe(
      map(responses => responses.map(response => new CannedResponse(response))),
      tap(responses => {
        this.store.upsertMany(responses);
      })
    );
  }

  updateEmailCannedResponse(req: CannedResponse): Observable<CannedResponse> {
    return this.httpClient
      .put<CannedResponse>(this.baseURL + `emails/cannedresponses/${req.level}/${req.id}`, req)
      .pipe(
        tap(_ => {
          this.store.upsert(req.id, req);
        })
      );
  }

  createEmailCannedResponse(req: CannedResponse): Observable<CannedResponse> {
    return this.httpClient.post<CannedResponse>(this.baseURL + `emails/cannedresponses/${req.level}`, req).pipe(
      map(response => new CannedResponse(response)),
      tap(response => {
        this.store.add(response);
      })
    );
  }

  deleteEmailCannedResponse(req: CannedResponse): Observable<CannedResponse> {
    return this.httpClient.delete<CannedResponse>(this.baseURL + `emails/cannedresponses/${req.level}/${req.id}`).pipe(
      tap(_ => {
        this.store.remove(req.id);
      })
    );
  }
}
