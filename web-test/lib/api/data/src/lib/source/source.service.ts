import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Source } from './source.model';
import { SourceStore } from './source.store';

@Injectable({
  providedIn: 'root'
})
export class SourceService {
  constructor(private http: HttpClient, private store: SourceStore) {}

  getSources() {
    return this.http.get<Source[]>(`/data/private/v4/raw`).pipe(
      map(res => {
        return res.map(res => new Source(res));
      }),
      tap(res => {
        this.store.set(res);
      })
    );
  }

  updateSource(source: Source) {
    let body = {
      iam: source.iam,
      statement: source.statement,
      esIndex: source.esIndex ? source.esIndex : null
    };
    return this.http.put<Source>(`/data/private/v4/raw/${source.descriptor}`, body).pipe(
      tap(_ => {
        if (source?.id) {
          this.store.update(source.id, source);
        } else {
          this.store.add(new Source(source));
        }
      })
    );
  }

  testDescriptor(descriptor: string, body) {
    let url = `/data/private/v4/rawSample/dump/${descriptor}`;

    if (Object.keys(body).indexOf('period') > -1) {
      url = `/data/private/v4/rawSample/${body.period}/${descriptor}`;
    }
    return this.http.post(url, body, { observe: 'response' });
  }

  deleteSource(source: Source) {
    return this.http.delete<void>(`/data/private/v4/raw/${source.descriptor}`).pipe(
      tap(_ => {
        this.store.remove(source.id);
      })
    );
  }
}
