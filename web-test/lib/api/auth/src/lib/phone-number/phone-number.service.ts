import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SendCodeResponse } from './phone-number';

@Injectable({
  providedIn: 'root'
})
export class PhoneNumberService {
  constructor(private http: HttpClient) {}

  sendCode(number: string, intent: string): Observable<SendCodeResponse> {
    return this.http.post<SendCodeResponse>(`/auth/private/v1/numbers/${number}/tokens?intent=${intent}`, {});
  }

  verifyCode(number: string, token: string, code: string) {
    return this.http.put(`/auth/private/v1/numbers/${number}/tokens/${token}?code=${code}`, {});
  }
}
