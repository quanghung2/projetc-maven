import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticatedAccessLink, CreatedAccessLinkReq, PublicAccess, PublicAccessStatus } from './public-access.model';

@Injectable({
  providedIn: 'root'
})
export class PublicAccessService {
  constructor(private http: HttpClient) {}

  fetchAll() {
    return this.http.get<PublicAccess[]>(`dashboard/private/v1/links`);
  }

  create(req: CreatedAccessLinkReq) {
    return this.http.post<PublicAccess>(`dashboard/private/v1/links`, req);
  }

  revoke(link: PublicAccess) {
    return this.http.put<PublicAccess>(`dashboard/private/v1/links/${link.ref}`, {
      status: PublicAccessStatus.disabled
    });
  }

  authenticate(ref, password: string) {
    return this.http.post<AuthenticatedAccessLink>(`dashboard/private/v1/links/auth`, { ref: ref, password: password });
  }
}
