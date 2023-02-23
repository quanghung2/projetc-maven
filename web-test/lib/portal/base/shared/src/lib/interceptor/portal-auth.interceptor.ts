import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpParameterCodec,
  HttpParams,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { API_RUN_AT_BACKDOOR } from '@b3networks/api/file';
import { ChatService } from '@b3networks/api/workspace';
import {
  CHAT_PUBLIC_PREFIX,
  CHAT_PUBLIC_V2_PREFIX,
  CHAT_PUBLIC_V3_PREFIX,
  DomainUtilsService,
  ERROR_PERMISSION,
  isLocalhost,
  X_B3_HEADER
} from '@b3networks/shared/common';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionQuery } from '../service/session/session.query';
import { SessionService } from '../service/session/session.service';

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
export class PortalAuthInterceptor implements HttpInterceptor {
  apiUrl: string = this.domainService.apiUrl;

  constructor(
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private domainService: DomainUtilsService,
    private chatService: ChatService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const chatPublicRequest = this.hasChatPublicRequest(req.url);
    const realReq = req.clone({
      url: this.buildUrl(req.url, chatPublicRequest),
      headers: this.buildHeaders(req.headers, chatPublicRequest),
      params: req.params ? this.buildParams(req.params) : req.params,
      withCredentials: isLocalhost() && !chatPublicRequest ? true : false // development need this to post cookie to outside
    });

    return next.handle(realReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (chatPublicRequest) {
          return throwError(err);
        }

        if (err.status === 401 && !err?.error?.message) {
          (err.error as unknown) = Object.assign(err.error, {
            message: ERROR_PERMISSION.message,
            code: ERROR_PERMISSION.code
          });
        }

        if (
          err.status === 401 &&
          err.error?.sec === 201 &&
          !req.url.includes('/auth/private/v1/sessiontokens') &&
          !req.url.includes('/auth/private/v2/sessiontokens') &&
          !chatPublicRequest
        ) {
          from(this._handle401Error(req, next, err));
        }
        const error = !chatPublicRequest && err?.error ? err.error : err;
        return throwError(error);
      })
    );
  }

  private async _handle401Error(request: HttpRequest<unknown>, next: HttpHandler, err: HttpErrorResponse) {
    const chatPublicRequest = this.hasChatPublicRequest(request.url);

    const result = await this.sessionService.refreshSession();
    if (result) {
      const tempReq = request.clone({
        url: this.buildUrl(request.url, chatPublicRequest),
        headers: this.buildHeaders(request.headers, chatPublicRequest),
        params: request.params ? this.buildParams(request.params) : request.params,
        withCredentials: isLocalhost() ? true : false // development need this to post cookie to outside
      });
      return next.handle(tempReq).toPromise();
    } else {
      // redirect to login page
      if (!this.router.url.includes('auth')) {
        this.router.navigate(['auth']);
      }

      const error = !chatPublicRequest && err?.error ? err.error : err;
      return throwError(error);
    }
  }

  private buildUrl(url: string, chatApi: string) {
    if (this.validUrl(url)) {
      return url;
    }
    if (url.startsWith('assets')) {
      return url;
    }

    if (url.indexOf('/') !== 0) {
      url = '/' + url;
    }

    if (!isLocalhost()) {
      const hasIgnoreZuul = API_RUN_AT_BACKDOOR.some(api => url.startsWith(api));
      if (hasIgnoreZuul) {
        if (url.startsWith(PRIVATE_FILE_PREFIX)) {
          url = url.slice(PRIVATE_FILE_PREFIX.length);
        } else if (url.startsWith(PUBLIC_FILE_PREFIX)) {
          url = url.slice(PUBLIC_FILE_PREFIX.length);
        }

        return this.domainService.storageBackdoorAPIUrl + (url ? url : '');
      }
    }
    if (!!chatApi && this.chatService.session != null) {
      const session = this.chatService.session;
      let apiAddress = session.addr;

      if (!isLocalhost()) {
        apiAddress = `${this.domainService.getPortalDomain()}/_${session.chatNode}`;
      }

      if (chatApi === CHAT_PUBLIC_PREFIX) {
        url = url.substring(2 + CHAT_PUBLIC_PREFIX.length, url.length);
        return `https://${apiAddress}/public/user/${session.chatUser}/${url}`;
      } else if (chatApi === CHAT_PUBLIC_V2_PREFIX) {
        url = url.substring(2 + CHAT_PUBLIC_V2_PREFIX.length, url.length);
        return `https://${apiAddress}/${url}`;
      } else if (chatApi === CHAT_PUBLIC_V3_PREFIX) {
        url = url.substring(2 + CHAT_PUBLIC_V3_PREFIX.length, url.length);
        return `https://${session.addr}/${url}`;
      }
    }

    return (url = this.apiUrl + (url ? url : ''));
  }

  /**
   * Temporary fix for Angular Team
   * https://github.com/angular/angular/issues/18261
   * @param params
   */
  private buildParams(params: HttpParams) {
    let overridedParams = new HttpParams({ encoder: new CustomEncoder() });
    if (params) {
      params.keys().forEach(key => {
        overridedParams = overridedParams.set(key, params.get(key));
      });
    }
    overridedParams = overridedParams.set('_ts', new Date().getTime());
    return overridedParams;
  }

  private validUrl(url: string) {
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url);
  }

  private buildHeaders(headers: HttpHeaders, chatApi: string) {
    headers = headers || new HttpHeaders();
    if (!!chatApi && this.chatService.session != null) {
      const session = this.chatService.session;
      headers = headers.set('Namespace', session.ns).set('Token', `${session.chatUser}:${session.token}`);
    } else {
      if (!headers.has(X_B3_HEADER.sessionToken)) {
        const fallbackSessionToken = this.sessionQuery.getValue().fallbackSessionToken;
        if (fallbackSessionToken) {
          headers = headers.set(X_B3_HEADER.sessionToken, fallbackSessionToken);
        }
      }
      if (!headers.has(X_B3_HEADER.orgUuid)) {
        const currentOrgUuid = this.sessionQuery.currentOrg?.orgUuid;
        if (currentOrgUuid && currentOrgUuid !== 'company') {
          headers = headers.set(X_B3_HEADER.orgUuid, currentOrgUuid);
        }
      }
    }

    return headers;
  }

  private hasChatPublicRequest(url: string) {
    if (url.indexOf('/') === 0) {
      url = url.substring(1, url.length - 1);
    }
    return url.indexOf(CHAT_PUBLIC_PREFIX) > -1
      ? CHAT_PUBLIC_PREFIX
      : url.indexOf(CHAT_PUBLIC_V2_PREFIX) > -1
      ? CHAT_PUBLIC_V2_PREFIX
      : url.indexOf(CHAT_PUBLIC_V3_PREFIX) > -1
      ? CHAT_PUBLIC_V3_PREFIX
      : null;
  }
}
