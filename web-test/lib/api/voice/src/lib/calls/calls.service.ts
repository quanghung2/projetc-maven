import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { guid } from '@datorama/akita';
import { MakeCallReq } from './make-call-req.model';

@Injectable({
  providedIn: 'root'
})
export class VoiceCallService {
  constructor(private http: HttpClient) {}

  makeCall(req: MakeCallReq) {
    const headers = new HttpHeaders({
      'x-idempotency-key': guid()
    });

    return this.http.post<void>(`/voiceapi/private/v1/calls`, req, {
      headers: headers
    });
  }
}
