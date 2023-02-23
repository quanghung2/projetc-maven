import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReleaseNote } from './release-note.modal';

@Injectable({
  providedIn: 'root'
})
export class ReleaseNoteService {
  constructor(private http: HttpClient) {}

  fetchReleases() {
    return this.http.get<ReleaseNote[]>(`/portal/private/v1/releases/self`);
  }
}
