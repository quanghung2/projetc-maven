import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoicesService {
  constructor(private httpClient: HttpClient) {}

  findVoices(): Observable<any> {
    return this.httpClient.get<any>(`tts/private/languages`);
  }
}
