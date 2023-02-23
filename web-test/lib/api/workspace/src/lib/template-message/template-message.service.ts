import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Template } from './template-message.model';
import { TemplateMessageStore } from './template-message.store';

@Injectable({
  providedIn: 'root'
})
export class TemplateMessageService {
  constructor(private httpClient: HttpClient, private store: TemplateMessageStore) {}

  getTemplate() {
    return this.httpClient.get<Template[]>('workspace/private/v1/whatsapp/templates').pipe(
      map(templates => templates.map(template => new Template(template))),
      tap(templates => {
        this.store.setLoading(true);
        this.store.set(templates);
      })
    );
  }

  getTemplateV2() {
    return this.httpClient.get<Template[]>('sms/private/v1/whatsapp/template').pipe(
      map(templates => templates.map(template => new Template(template))),
      tap(templates => {
        this.store.set(templates);
      })
    );
  }
}
