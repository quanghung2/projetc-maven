import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DisplayConfig, LocalLink } from './callrecording.model';

@Injectable({
  providedIn: 'root'
})
export class CallRecordingService {
  constructor(private http: HttpClient) {}

  getDisplayConfig() {
    return this.http.get<DisplayConfig>(`callrecording-v2/private/v1/displayConfig`);
  }

  getLocalLink(fileKey: string) {
    return this.http.get<LocalLink>(`callrecording-v2/private/v1/localLink/${fileKey}`);
  }
}
