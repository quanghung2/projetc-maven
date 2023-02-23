import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnnouncementResp, PostCreateAnnouncementReq, PutUpdateAnnouncementReq } from './announcement.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  constructor(private http: HttpClient) {}

  getAnnouncements(): Observable<AnnouncementResp[]> {
    return this.http
      .get<AnnouncementResp[]>(`/portal/private/v1/announcements`)
      .pipe(map(list => list.map(ann => new AnnouncementResp(ann))));
  }

  create(req: PostCreateAnnouncementReq): Observable<void> {
    return this.http.post<void>(`/portal/private/v1/announcements`, req);
  }

  update(id: number, req: PutUpdateAnnouncementReq): Observable<void> {
    return this.http.put<void>(`/portal/private/v1/announcements/${id}`, req);
  }
}
