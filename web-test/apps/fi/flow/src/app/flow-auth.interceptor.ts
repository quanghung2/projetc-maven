import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { APP_IDS, X_B3_HEADER } from '@b3networks/shared/common';

@Injectable({ providedIn: 'root' })
export class FlowAuthInterceptor extends AuthInterceptor {
  protected override buildHeaders(headers: HttpHeaders, chatApi: string, url: string) {
    let h = super.buildHeaders(headers, chatApi, url);

    h = h.set(X_B3_HEADER.clientAppId, APP_IDS.FLOW);

    return h;
  }
}
