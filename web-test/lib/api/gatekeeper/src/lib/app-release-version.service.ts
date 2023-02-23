import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

export class ReleaseVersion {
  version: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get isHaveNoVersion() {
    return this.version === '*';
  }
}

@Injectable({
  providedIn: 'root'
})
export class AppReleaseVersionService {
  constructor(private http: HttpClient) {}

  getReleaseVersion(appId: string) {
    return this.http
      .get<ReleaseVersion>(`gatekeeper/ui/private/v1/release/version/${appId}`)
      .pipe(map(version => new ReleaseVersion(version)));
  }
}
