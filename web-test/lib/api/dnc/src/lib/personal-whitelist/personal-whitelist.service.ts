import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { PersonalWhitelist, PersonalWhitelistEnabled } from './personal-whitelist.model';
import { PersonalWhitelistStore } from './personal-whitelist.store';

@Injectable({
  providedIn: 'root'
})
export class PersonalWhitelistService {
  constructor(private http: HttpClient, private store: PersonalWhitelistStore) {}

  getAll() {
    return this.http
      .get<{ entries: PersonalWhitelistEnabled[] }>(`dnc/private/v1/personalWhitelistEnabled`)
      .pipe(map(x => x?.entries || []));
  }

  getByIdentityUuid(identityUuid: string) {
    return this.http.get<PersonalWhitelistEnabled>(`dnc/private/v1/personalWhitelistEnabled/${identityUuid}`).pipe(
      map(res => new PersonalWhitelistEnabled(res)),
      tap(personal => {
        this.store.upsertMany([personal], { baseClass: PersonalWhitelistEnabled });
      })
    );
  }

  update(identityUuid: string) {
    return this.http.put(`dnc/private/v1/personalWhitelistEnabled/${identityUuid}`, {});
  }

  delete(identityUuid: string) {
    return this.http.delete(`dnc/private/v1/personalWhitelistEnabled/${identityUuid}`);
  }

  search(prefix: string) {
    const encode = encodeURIComponent(prefix);
    return this.http
      .get<{ entries: PersonalWhitelist[] }>(`dnc/private/v1/personalWhitelist/${encode}`)
      .pipe(map(x => x?.entries || []));
  }

  addNumber(number: string, body: Partial<PersonalWhitelist>) {
    const encode = encodeURIComponent(number);
    return this.http.put(`dnc/private/v1/personalWhitelist/${encode}`, body);
  }

  deleteNumber(number: string) {
    const encode = encodeURIComponent(number);
    return this.http.delete(`dnc/private/v1/personalWhitelist/${encode}`);
  }

  updateGrantPermission(isPermission: boolean) {
    this.store.update({
      hasGrantedPersonalWhitelist: isPermission
    });
  }
}
