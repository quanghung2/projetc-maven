import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Template } from './template.model';
import { TemplateStore } from './template.store';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(private http: HttpClient, private store: TemplateStore) {}

  getTemplates() {
    return this.http.get<Template[]>(`/data/private/v4/template`).pipe(
      map(res => {
        return res.map(res => new Template(res));
      }),
      tap(res => {
        this.store.set(res);
      })
    );
  }

  updateTemplate(template: Template, period: string) {
    let body = {
      descriptor: template.descriptor,
      label: template.label,
      config: {
        [period]: template.config
      }
    };

    return this.http.put<Template>(`/data/private/v4/template/${template.code}`, body).pipe(
      tap(_ => {
        body['code'] = template.code;
        if (template?.id) {
          this.store.update(template.id, new Template(body));
        } else {
          this.store.add(new Template(body));
        }
      })
    );
  }

  downloadReport(template: Template, body) {
    let per = template.type == 'agg' ? '1d' : 'dump';
    let url = `data/private/v4/csvSample/${per}/${template.code}`;
    return this.http.post(url, body, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  deleteTemplate(template: Template) {
    return this.http.delete<void>(`/data/private/v4/template/${template.code}`).pipe(
      tap(_ => {
        this.store.remove(template.id);
      })
    );
  }
}
