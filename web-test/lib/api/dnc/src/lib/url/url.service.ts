import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  constructor(private http: HttpClient) {}

  download(key: string) {
    const params = new HttpParams().append('key', key);
    return this.http
      .get<{ url: string }>(`dnc/api/v2/private/urls/preSigned`, {
        params: params
      })
      .pipe(map(resp => resp?.url));
  }
}
