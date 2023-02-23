import { HttpHeaders, HttpParameterCodec } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { APP_IDS, X_B3_HEADER } from '@b3networks/shared/common';

declare const X: any;
const PRIVATE_FILE_PREFIX = '/file/private';
const PUBLIC_FILE_PREFIX = '/file/public';

class CustomEncoder implements HttpParameterCodec {
  encodeKey(key: string): string {
    return encodeURIComponent(key);
  }

  encodeValue(value: string): string {
    return encodeURIComponent(value);
  }

  decodeKey(key: string): string {
    return decodeURIComponent(key);
  }

  decodeValue(value: string): string {
    return decodeURIComponent(value);
  }
}

@Injectable({ providedIn: 'root' })
export class FlowAuthInterceptor extends AuthInterceptor {
  protected override buildHeaders(headers: HttpHeaders, chatApi: string, url: string) {
    let h = super.buildHeaders(headers, chatApi, url);

    h = h.set(X_B3_HEADER.clientAppId, APP_IDS.FLOW);

    return h;
  }
}
