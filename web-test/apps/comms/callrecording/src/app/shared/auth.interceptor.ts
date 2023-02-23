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
import { DomainUtilsService, ERROR_PERMISSION, isLocalhost } from '@b3networks/shared/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const X_SESSION_TOKEN = 'x-credential-session-token';
const X_ORG = 'x-user-org-uuid';

declare var X: any;

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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  apiUrl: string = this.domainUtilService.apiUrl;

  constructor(private domainUtilService: DomainUtilsService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const builtReq = req.clone({
      url: this.buildUrl(req.url),
      headers: this.buildHeaders(req.headers),
      withCredentials: isLocalhost() ? true : false, // development need this to post cookie to outside
      params: req.params ? this.buildParams(req.params) : req.params
    });

    return next.handle(builtReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !error?.error?.message) {
          (error.error as unknown) = Object.assign(error.error, {
            message: ERROR_PERMISSION.message,
            code: ERROR_PERMISSION.code
          });
        }

        return throwError(error.error !== null ? error.error : error);
      })
    );
  }

  buildUrl(url: string) {
    if (this.validUrl(url) || url.startsWith('assets')) {
      return url;
    }
    if (url.indexOf('/') !== 0) {
      url = '/' + url;
    }
    return (url = this.apiUrl + (url ? url : ''));
  }

  /**
   * Temporary fix for Angular Team
   * https://github.com/angular/angular/issues/18261
   * @param params
   */
  buildParams(params: HttpParams) {
    let overridedParams = new HttpParams({ encoder: new CustomEncoder() });
    params.keys().forEach(key => {
      overridedParams = overridedParams.set(key, params.get(key));
    });
    return overridedParams;
  }

  validUrl(url: string) {
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url);
  }

  buildHeaders(headers: HttpHeaders) {
    headers = headers || new HttpHeaders();

    //sometime we set org info on api caller
    if (!headers.has('orgUuid') && X.getContext()['orgUuid']) {
      headers = headers.set(X_ORG, X.getContext()['orgUuid']);
    }
    if (X.getContext()['sessionToken']) {
      headers = headers.set(X_SESSION_TOKEN, X.getContext()['sessionToken']);
    }
    return headers;
  }
}
