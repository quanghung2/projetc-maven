import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Card } from './card.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  constructor(private http: HttpClient) {}

  create(dashboardUuid: string, card: Card) {
    return this.http
      .post<Card>(`dashboard/private/v1/dashboards/${dashboardUuid}/cards`, card)
      .pipe(map(resp => Card.fromResp(resp)));
  }

  fetchAll(dashboardUuid: string) {
    return this.http
      .get<Card[]>(`dashboard/private/v1/dashboards/${dashboardUuid}/cards`)
      .pipe(map(list => list.map(card => Card.fromResp(card))));
  }

  getOne(dashboardUuid, uuid: string) {
    return this.http
      .get<Card>(`dashboard/private/v1/dashboards/${dashboardUuid}/cards/${uuid}`)
      .pipe(map(resp => Card.fromResp(resp)));
  }

  update(card: Card) {
    return this.http
      .put<Card>(`dashboard/private/v1/dashboards/${card.dashboardUuid}/cards/${card.uuid}`, card)
      .pipe(map(resp => Card.fromResp(resp)));
  }

  delete(card: Card) {
    return this.http.delete<void>(`dashboard/private/v1/dashboards/${card.dashboardUuid}/cards/${card.uuid}`);
  }
}
