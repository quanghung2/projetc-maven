import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { AutoResponse, AutoResponseRequest } from './auto-response.model';
import { AutoResponseStore } from './auto-response.store';

@Injectable({
  providedIn: 'root'
})
export class AutoResponseService {
  constructor(private httpClient: HttpClient, private store: AutoResponseStore) {}

  getAutoResponse() {
    return this.httpClient.get<AutoResponse[]>('workspace/private/v1/whatsapp/autoresponse').pipe(
      map(responses => responses.map(response => new AutoResponse(response))),
      tap(responses => {
        this.store.setLoading(true);
        this.store.set(responses);
      })
    );
  }

  createAutoResponse(req: AutoResponseRequest) {
    return this.httpClient.post<AutoResponseRequest>('workspace/private/v1/whatsapp/autoresponse', req).pipe(
      map(res => new AutoResponse(res)),
      tap(res => {
        this.store.setLoading(true);
        this.store.add(res);
      })
    );
  }

  deleteAutoResponse(event: string) {
    return this.httpClient
      .delete<AutoResponseRequest>(`workspace/private/v1/whatsapp/autoresponse?event=${event}`)
      .pipe(
        tap(_ => {
          this.store.setLoading(true);
          this.store.remove(event);
        })
      );
  }
}
