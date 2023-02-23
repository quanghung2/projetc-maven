import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Profile } from './profile.model';
import { ProfileStore } from './profile.store';
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private store: ProfileStore, private http: HttpClient) {}

  create(profile: Partial<Profile>): Observable<Profile> {
    return this.http.post<Profile>('auth/private/v1/profiles', profile).pipe(tap(data => this.store.update(data)));
  }

  update(profile: Partial<Profile>): Observable<Profile> {
    return this.http.put<Profile>('auth/private/v1/profiles', profile).pipe(tap(data => this.store.update(data)));
  }

  resolveProfile(enUrl: string) {
    const params = new HttpParams().append('encUrl', enUrl);
    return this.http
      .get<Profile>('auth/private/v1/profiles/resolve', { params: params })
      .pipe(tap(data => this.store.update(data)));
  }
}
