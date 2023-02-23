import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateTemplateRequest, EventTemplate, UpdateTemplateRequest } from './template.model';

@Injectable({
  providedIn: 'root'
})
export class BookingTemplateService {
  constructor(private httpClient: HttpClient) {}

  createTemplate(request: CreateTemplateRequest) {
    return this.httpClient.post<EventTemplate>('/booking/private/app/v1/eventTemplates', request);
  }

  updateTemplate(uniqueId: string, request: UpdateTemplateRequest) {
    return this.httpClient.put(`/booking/private/app/v1/eventTemplates/${uniqueId}`, request);
  }

  deleteTemplate(uniqueId: string) {
    return this.httpClient.delete<void>(`/booking/private/app/v1/eventTemplates/${uniqueId}`);
  }

  getTemplate(uniqueId: string): Observable<EventTemplate> {
    return this.httpClient
      .get<EventTemplate>(`/booking/private/app/v1/eventTemplates/${uniqueId}`)
      .pipe(map(res => new EventTemplate(res)));
  }

  getTemplates(): Observable<EventTemplate[]> {
    return this.httpClient
      .get<EventTemplate[]>('/booking/private/app/v1/eventTemplates')
      .pipe(map(res => res.map(r => new EventTemplate(r))));
  }
}
