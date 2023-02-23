import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  RefreshRecoveryKeyRequest,
  RefreshRecoveryKeyResponse,
  SendOtpCodeRequest,
  SendOtpCodeResponse,
  TfaInfo,
  Toggle2FaRequest,
  Toggle2FaResponse,
  TotpRequest,
  TotpResponse,
  Verify2FaRequest,
  Verify2FaResponse
} from './tfa';
import { TfaInfoStore } from './tfa.store';

@Injectable({
  providedIn: 'root'
})
export class TfaService {
  constructor(private http: HttpClient, private tfaStore: TfaInfoStore) {}

  get2FaInfo(): Observable<TfaInfo> {
    return this.http.get<TfaInfo>(`/auth/private/v2/tfa/settings`).pipe(tap(res => this.tfaStore.update(res)));
  }

  sendOtpCodeToEmail(sendOtpCodeRequest: SendOtpCodeRequest): Observable<SendOtpCodeResponse> {
    return this.http.post<SendOtpCodeResponse>(`/auth/private/v2/tfa/otp`, sendOtpCodeRequest);
  }

  toggle2Fa(toggle2FaRequest: Toggle2FaRequest): Observable<Toggle2FaResponse> {
    return this.http.put<Toggle2FaResponse>(`/auth/private/v2/tfa/settings`, toggle2FaRequest).pipe(
      map(res => new Toggle2FaResponse(res)),
      tap(resp => {
        this.tfaStore.update({ tfaEnabled: !!resp.recoveryKey, recoveryKey: resp.recoveryKey });
      })
    );
  }

  verify2Fa(verify2FaRequest: Verify2FaRequest): Observable<Verify2FaResponse> {
    return this.http.post<Verify2FaResponse>(`/auth/private/v2/tfa`, verify2FaRequest);
  }

  refreshRecoveryCode(refreshRecoveryKeyRequest: RefreshRecoveryKeyRequest): Observable<RefreshRecoveryKeyResponse> {
    return this.http.put<RefreshRecoveryKeyResponse>(`/auth/private/v2/tfa/recovery`, refreshRecoveryKeyRequest);
  }

  getTotpCode(): Observable<TotpResponse> {
    return this.http.post<TotpResponse>(`/auth/private/v2/tfa/settings/totp`, {});
  }

  verifyTotpCode(request: TotpRequest): Observable<TotpResponse> {
    return this.http.put<TotpResponse>(`/auth/private/v2/tfa/settings/totp`, request);
  }

  deleteTotp() {
    return this.http.delete(`/auth/private/v2/tfa/settings/totp`);
  }
}
