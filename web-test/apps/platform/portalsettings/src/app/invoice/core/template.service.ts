import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Template } from './template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  constructor(private httpClient: HttpClient) {}

  getTemplate(currency: string): Observable<Template> {
    let params = new HttpParams();
    params = params.set('currency', currency);

    return this.httpClient.get(`/invoice/private/v3/templates`, { params: params }).pipe(map(res => this.toModel(res)));
  }

  updateTemplate(template: Template): Observable<any> {
    return this.httpClient.put(`/invoice/private/v3/templates`, template);
  }

  private toModel(r): Template {
    return Object.assign(new Template(), r);
  }
}
