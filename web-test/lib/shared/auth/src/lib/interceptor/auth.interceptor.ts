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
import { CustomersService } from '@b3networks/api/callcenter';
import { API_RUN_AT_BACKDOOR } from '@b3networks/api/file';
import { ChatService, MediaService, S3Service } from '@b3networks/api/workspace';
import {
  CHAT_PUBLIC_PREFIX,
  CHAT_PUBLIC_V2_PREFIX,
  CHAT_PUBLIC_V3_PREFIX,
  DomainUtilsService,
  ERROR_PERMISSION,
  isLocalhost,
  X as _X,
  X_B3_HEADER
} from '@b3networks/shared/common';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
export class AuthInterceptor implements HttpInterceptor {
  apiUrl = this.domainService.apiUrl;

  get X() {
    return typeof X !== 'undefined' ? X : _X;
  }

  constructor(protected domainService: DomainUtilsService, protected chatService: ChatService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const chatPublicRequest = this.hasChatPublicRequest(req.url);
    const builtReq = req.clone({
      url: this.buildUrl(req.url, chatPublicRequest),
      headers: this.buildHeaders(req.headers, chatPublicRequest, req.url),
      params: this.buildParams(req.params),
      withCredentials: isLocalhost() && !chatPublicRequest ? true : false // development need this to post cookie to outside
    });

    return next.handle(builtReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (chatPublicRequest) {
          return throwError(err);
        }

        from(this._handleError(req, next, err));
        const error = !chatPublicRequest && err?.error ? err.error : err;
        return throwError(error);
      })
    );
  }

  protected async _handleError(request: HttpRequest<unknown>, next: HttpHandler, err: HttpErrorResponse) {
    const chatPublicRequest = this.hasChatPublicRequest(request.url);
    let e = err ? err?.error : err;

    if (err.status === 401 && !e?.message) {
      (err.error as unknown) = Object.assign(err.error, {
        message: ERROR_PERMISSION.message,
        code: ERROR_PERMISSION.code
      });
    }

    if (err?.error instanceof Blob) {
      const er = await (err.error as Blob).text();
      e = this.parseJsonString(er) || e;
    }

    if (err.status === 401 && e?.sec === 201 && !chatPublicRequest) {
      from(this._handle401Error(request, next, err));
    }

    return throwError(e);
  }

  protected async _handle401Error(request: HttpRequest<unknown>, next: HttpHandler, err: HttpErrorResponse) {
    this.X.showAuth();

    let e = err ? err?.error : err;
    if (err?.error instanceof Blob) {
      const er = await (err.error as Blob).text();
      e = this.parseJsonString(er) || e;
    }

    return throwError(e);
  }

  private buildUrl(url: string, chatApi: string) {
    if (this.validUrl(url) || url.startsWith('assets')) {
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
        return `https://${apiAddress}/${url}`;
      }
    }

    return this.apiUrl + (url ? url : '');
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

  protected buildHeaders(headers: HttpHeaders, chatApi: string, url: string) {
    headers = headers || new HttpHeaders();

    if (!!chatApi && this.chatService.session != null) {
      const session = this.chatService.session;
      headers = headers.set('Namespace', session.ns).set('Token', `${session.chatUser}:${session.token}`);
    } else {
      const orgUuid = this.X.orgUuid;
      const session = this.X.sessionToken;
      //sometime we set org info on api caller
      if (!headers.has(X_B3_HEADER.orgUuid) && !!orgUuid) {
        headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
      }

      if (session) {
        headers = headers.set(X_B3_HEADER.sessionToken, session);
      }
    }

    // api public
    if (
      url.indexOf(S3Service.URL_MEDIA_PUBLIC) > -1 ||
      url.indexOf(MediaService.URL_MEDIA_THUMBNAIL_PUBLIC) > -1 ||
      url.indexOf(CustomersService.URL_CREATE_TXN) > -1
    ) {
      if (headers.has(X_B3_HEADER.sessionToken)) {
        headers = headers.delete(X_B3_HEADER.sessionToken);
      }

      headers = headers.set(X_B3_HEADER.domain, this.domainService.getPortalDomain());
    }

    return headers;
  }

  private parseJsonString(str: string) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }
}
