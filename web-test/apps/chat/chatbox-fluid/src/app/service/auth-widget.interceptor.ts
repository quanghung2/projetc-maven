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
import { ChatService, MediaService, S3Service } from '@b3networks/api/workspace';
import {
  CHAT_PUBLIC_PREFIX,
  CHAT_PUBLIC_V2_PREFIX,
  DomainUtilsService,
  ERROR_PERMISSION,
  X as _X,
  X_B3_HEADER
} from '@b3networks/shared/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

declare const X: any;

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
export class AuthWidgetInterceptor implements HttpInterceptor {
  apiUrl = 'https://api.b3networks.com/_ac';

  get X() {
    return typeof X !== 'undefined' ? X : _X;
  }

  constructor(private domainService: DomainUtilsService, private chatService: ChatService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const chatPublicRequest = this.hasChatPublicRequest(req.url);
    const builtReq = req.clone({
      url: this.buildUrl(req.url, chatPublicRequest),
      headers: this.buildHeaders(req.headers, chatPublicRequest, req.url),
      params: req.params ? this.buildParams(req.params) : req.params
    });

    return next.handle(builtReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error != null) {
          if (error.status === 401 && !error.error?.message) {
            (error.error as unknown) = Object.assign(error.error, {
              message: ERROR_PERMISSION.message,
              code: ERROR_PERMISSION.code
            });
          }

          if (error.status === 401 && !chatPublicRequest && builtReq.url.startsWith(this.apiUrl)) {
            this.X.showAuth();
          }
          return throwError(error.error);
        } else {
          return throwError(error);
        }
      })
    );
  }

  private buildUrl(url: string, chatApi: string) {
    if (this.validUrl(url) || url.startsWith('assets')) {
      return url;
    }

    if (url.indexOf('/') !== 0) {
      url = '/' + url;
    }

    if (!!chatApi && this.chatService.session != null) {
      const session = this.chatService.session;
      const apiAddress = session.addr;
      // if (!isLocalhost()) {
      //   apiAddress = `${this.domainService.getPortalDomain()}/_${session.chatNode}`;
      // }

      if (chatApi === CHAT_PUBLIC_PREFIX) {
        url = url.substring(2 + CHAT_PUBLIC_PREFIX.length, url.length);
        return `https://${apiAddress}/public/user/${session.chatUser}/${url}`;
      } else if (chatApi === CHAT_PUBLIC_V2_PREFIX) {
        url = url.substring(2 + CHAT_PUBLIC_V2_PREFIX.length, url.length);
        return `https://${apiAddress}/${url}`;
      }
    }

    return (url = this.apiUrl + (url ? url : ''));
  }

  private hasChatPublicRequest(url: string) {
    if (url.indexOf('/') === 0) {
      url = url.substring(1, url.length - 1);
    }
    return url.indexOf(CHAT_PUBLIC_PREFIX) > -1
      ? CHAT_PUBLIC_PREFIX
      : url.indexOf(CHAT_PUBLIC_V2_PREFIX) > -1
      ? CHAT_PUBLIC_V2_PREFIX
      : null;
  }

  /**
   * Temporary fix for Angular Team
   * https://github.com/angular/angular/issues/18261
   * @param params
   */
  private buildParams(params: HttpParams) {
    let overridedParams = new HttpParams({ encoder: new CustomEncoder() });
    params.keys().forEach(key => {
      overridedParams = overridedParams.set(key, params.get(key));
    });
    return overridedParams;
  }

  private validUrl(url: string) {
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url);
  }

  private buildHeaders(headers: HttpHeaders, chatApi: string, url: string) {
    headers = headers || new HttpHeaders();

    if (!!chatApi && this.chatService.session != null) {
      const session = this.chatService.session;
      headers = headers.set('Namespace', session.ns).set('Token', `${session.chatUser}:${session.token}`);
    } else {
      const orgUuid = this.X.orgUuid;
      //sometime we set org info on api caller
      if (!headers.has(X_B3_HEADER.orgUuid) && !!orgUuid) {
        headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
      }

      if (orgUuid) {
        const session = this.chatService.state?.tokenLiveChatRecover;
        if (!!session) {
          headers = headers.set(X_B3_HEADER.sessionToken, session);
        }
      }
    }

    // api public
    if (
      url.indexOf(S3Service.URL_MEDIA_PUBLIC) > -1 ||
      url.indexOf(MediaService.URL_MEDIA_THUMBNAIL_PUBLIC) > -1
      // || url.indexOf(CustomersService.URL_CREATE_TXN) > -1
    ) {
      const domain = location?.hostname.indexOf('localhost') > -1 ? 'portal.hoiio.net' : location?.hostname;
      headers = headers.set(X_B3_HEADER.domain, domain);
    }

    return headers;
  }
}
