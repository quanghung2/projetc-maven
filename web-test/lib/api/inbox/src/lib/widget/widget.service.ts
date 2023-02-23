import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { StoreWidgetRequest, Widget } from './widget.model';
import { WidgetStore } from './widget.store';

@Injectable({
  providedIn: 'root'
})
export class WidgetService {
  constructor(private http: HttpClient, private store: WidgetStore) {}

  getAllByInboxUuid(inboxUuid: string) {
    const params = new HttpParams().append('inboxUuid', inboxUuid);
    return this.http.get<Widget[]>('inbox/private/v2/livechat/widgets', { params: params }).pipe(
      map(responses => responses.map(response => new Widget({ ...response, inboxUuid: inboxUuid }))),
      tap(responses => {
        this.store.set(responses);
      })
    );
  }

  getDetail(widgetUuid: string) {
    return this.http.get<Widget>(`inbox/private/v2/livechat/widgets/${widgetUuid}`).pipe(
      map(data => new Widget(data)),
      tap(data => {
        this.store.upsertMany([data]);
      })
    );
  }

  createWidget(req: StoreWidgetRequest) {
    return this.http.post<Widget>('inbox/private/v2/livechat/widgets', req).pipe(
      map(data => new Widget(data)),
      tap(res => {
        this.store.upsertMany([res]);
      })
    );
  }

  updateWidget(widgetUuid: string, req: StoreWidgetRequest) {
    return this.http.put<Widget>(`inbox/private/v2/livechat/widgets/${widgetUuid}`, req).pipe(
      map(data => new Widget(data)),
      tap(res => {
        this.store.upsertMany([res]);
      })
    );
  }
}
