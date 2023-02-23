import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomainUtilsService, downloadData } from '@b3networks/shared/common';
import * as _ from 'lodash';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export enum HttpMethod {
  GET = 0,
  POST = 1,
  PUT = 2,
  DELETE = 3
}

declare let X: any;

@Injectable()
export class BackendService {
  private backendEndpoint: string = environment.app.backend;

  constructor(private domainUtil: DomainUtilsService, private http: HttpClient) {
    X.init(environment.app.env);
  }

  get(url: string, params?: any): Promise<Object> {
    return this.request(HttpMethod.GET, url, params);
  }

  post(url: string, data: any): Promise<Object> {
    return this.request(HttpMethod.POST, url, data);
  }

  put(url: string, data: any): Promise<Object> {
    return this.request(HttpMethod.PUT, url, data);
  }

  delete(url: string): Promise<Object> {
    return this.request(HttpMethod.DELETE, url);
  }

  requestOptions(): any {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    });

    headers = headers.set('x-hoiio-credential-session-token', X.getContext().sessionToken);
    headers = headers.set('x-hoiio-user-org-uuid', X.getContext().orgUuid);

    if (X.getContext().sessionToken && X.getContext().orgUuid) {
      this.setCookie('sessionToken', X.getContext().sessionToken);
      this.setCookie('orgUuid', X.getContext().orgUuid);
    }

    if (environment.app.env == 'dev') {
      const sessionToken = this.getCookie('sessionToken');
      const orgUuid = this.getCookie('orgUuid');
      headers = headers.set('x-hoiio-credential-session-token', sessionToken);
      headers = headers.set('x-hoiio-user-org-uuid', orgUuid);
    }

    return { headers: headers };
  }

  setCookie(key, value) {
    const expires = new Date();
    expires.setTime(expires.getTime() + 1 * 24 * 60 * 60 * 1000);
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
  }

  getCookie(key) {
    const keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
  }

  request(method: HttpMethod, url: string, data?: any): Promise<Object> {
    url = this.parseApiUrlInternal(url);
    const options: any = { observe: 'response' };
    // options.observe = "response";
    let request: Observable<HttpEvent<Object>>;
    if (method == HttpMethod.GET) {
      if (data != undefined) {
        options.params = new HttpParams();
        _.forEach(Object.keys(data), (key: string) => {
          if (data[key]) {
            options.params = options.params.set(key, data[key]);
          }
        });
      }
      request = this.http.get<any>(url, options);
    } else if (method == HttpMethod.POST) {
      request = this.http.post<any>(url, data, options);
    } else if (method == HttpMethod.PUT) {
      request = this.http.put<any>(url, data, options);
    } else if (method == HttpMethod.DELETE) {
      if (data != undefined) {
        options.params = new HttpParams();
        _.forEach(Object.keys(data), (key: string) => {
          if (data[key]) {
            options.params = options.params.set(key, data[key]);
          }
        });
      }
      request = this.http.delete<any>(url, options);
    }

    return (
      request
        .pipe(
          map(res => {
            const headers = (<HttpResponse<any>>res).headers;
            if (headers.get('content-type').indexOf('text/csv') >= 0) {
              let content = (<HttpResponse<any>>res).body;

              // for get csv records (temporary)
              content = content.replace(/hoiio-dl.s3.amazonaws.com/g, 'd3ht3vyhyd612i.cloudfront.net');

              const blob = new Blob([content], {
                type: 'text/csv;charset=utf-8'
              });
              downloadData(blob, `Record History - ${new Date()}.csv`);
              return {
                ok: true
              };
            }
            return (<HttpResponse<any>>res).body;
          }),
          catchError(this.handleError),
          take(1)
          // catch(this.handleError)
          // .take(1)
        )
        // .timeout(60000)
        .toPromise()
    );
  }

  parseApiUrl(url: string, cache: boolean = true, endpoint?: string) {
    if (!endpoint) {
      endpoint = this.domainUtil.apiUrl;
    }
    if (!/^https?:\/\/.*/gi.test(url)) {
      if (url.indexOf('/') != 0) {
        url = '/' + url;
      }
      url = endpoint + url;
    }
    if (!cache) {
      if (url.indexOf('?') > 0) {
        url = url + '&_=' + Date.now();
      } else {
        url = url + '?_=' + Date.now();
      }
    }
    return url;
  }

  parseApiUrlInternal(url: string, cache: boolean = true, endpoint: string = this.backendEndpoint) {
    if (!/^https?:\/\/.*/gi.test(url)) {
      if (url.indexOf('/') != 0) {
        url = '/' + url;
      }
      url = endpoint + url;
    }
    if (!cache) {
      if (url.indexOf('?') > 0) {
        url = url + '&_=' + Date.now();
      } else {
        url = url + '?_=' + Date.now();
      }
    }
    return url;
  }

  private handleError(error: HttpErrorResponse | any) {
    let errMsg;
    try {
      if (error instanceof HttpErrorResponse) {
        errMsg = error || '';
      } else {
        errMsg = error && error.message ? error.message : '';
      }
      console.error(errMsg);
    } catch (e) {
      console.error(error);
    }

    return observableThrowError(error);
  }
}
