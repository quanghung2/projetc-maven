import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { GetNoteTemplate, NoteTemplate } from './note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  constructor(private http: HttpClient) {}

  getNoteTemplates(req?: GetNoteTemplate) {
    let params = new HttpParams();
    if (req && !!req.module) {
      params = params.set('module', req.module);
    }
    return this.http.get<NoteTemplate[]>(`/data/private/v1/noteTemplate`, { params: params });
  }

  getNoteTemplate(templateUuid: string) {
    return this.http
      .get<NoteTemplate>(`/data/private/v1/noteTemplate/${templateUuid}`)
      .pipe(map(noteTemplate => new NoteTemplate({ ...noteTemplate, templateUuid })));
  }

  createNoteTemplate(templateUuid: string, noteTemplate: Partial<NoteTemplate>) {
    return this.http.put(`/data/private/v1/noteTemplate/${templateUuid}`, noteTemplate);
  }

  removeNoteTemplate(templateUuid: string) {
    return this.http.delete(`/data/private/v1/noteTemplate/${templateUuid}`);
  }

  download(templateUuid: string, start: string, end: string) {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get(`/data/private/v1/noteTemplate/${templateUuid}/csvDump`, {
      params: params,
      observe: 'response',
      responseType: 'blob'
    });
  }
}
