import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Extension } from '@b3networks/api/bizphone';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Licence, LicenceType } from './licence';

@Injectable({
  providedIn: 'root'
})
export class LicenceService {
  constructor(private http: HttpClient) {}

  findLicences(type: LicenceType): Observable<Licence[]> {
    const url = `callcenter/private/v1/licences/` + (type === LicenceType.agent ? `agents` : `supervisors`);
    return this.http.get<Licence[]>(url).pipe(map(agents => agents.map(a => new Licence(type, a))));
  }

  assignLicence(req: AssignLicenceReq) {
    const url = `callcenter/private/v1/licences/` + (req.type === LicenceType.agent ? `agents` : `supervisors`);

    return this.http.post<Licence>(url, req).pipe(map(licence => new Licence(req.type, licence)));
  }

  unassignLicence(req: UnassignLicenceReq) {
    const url =
      `callcenter/private/v1/licences/` +
      (req.type === LicenceType.agent ? `agents` : `supervisors`) +
      `/${req.extensionKey}`;

    return this.http.delete<Licence>(url);
  }

  findExtensions(): Observable<Extension[]> {
    return this.http
      .get<Extension[]>(`callcenter/private/v1/licences/extensions`)
      .pipe(map(exts => exts.map(ext => new Extension(ext))));
  }

  releaseExtension(extension: Extension): Observable<Licence> {
    return this.http.delete<Licence>(`callcenter/private/v1/licences/extensions/${extension.extKey}`);
  }
}

export interface AssignLicenceReq {
  type: LicenceType;
  extensionKey: string;
  identityUuid: string;
  extensionLabel: string;
}

export interface UnassignLicenceReq {
  type: LicenceType;
  extensionKey: string;
}
