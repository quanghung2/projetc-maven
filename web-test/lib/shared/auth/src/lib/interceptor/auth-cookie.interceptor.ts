// import {
//   HttpEvent,
//   HttpHandler,
//   HttpHeaders,
//   HttpInterceptor,
//   HttpParameterCodec,
//   HttpParams,
//   HttpRequest
// } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { CustomersService } from '@b3networks/api/callcenter';
// import { API_RUN_AT_BACKDOOR } from '@b3networks/api/file';
// import { MediaService, S3Service } from '@b3networks/api/workspace';
// import { DomainUtilsService, isLocalhost, X as _X, X_B3_HEADER } from '@b3networks/shared/common';
// import { Observable } from 'rxjs';

// declare const X: any;

// const PRIVATE_FILE_PREFIX = '/file/private';
// const PUBLIC_FILE_PREFIX = '/file/public';

// class CustomEncoder implements HttpParameterCodec {
//   encodeKey(key: string): string {
//     return encodeURIComponent(key);
//   }

//   encodeValue(value: string): string {
//     return encodeURIComponent(value);
//   }

//   decodeKey(key: string): string {
//     return decodeURIComponent(key);
//   }

//   decodeValue(value: string): string {
//     return decodeURIComponent(value);
//   }
// }

// @Injectable({ providedIn: 'root' })
// export class AuthCookieInterceptor implements HttpInterceptor {
//   apiUrl = this.domainService.apiUrl;

//   get X() {
//     return typeof X !== 'undefined' ? X : _X;
//   }

//   constructor(protected domainService: DomainUtilsService) {}

//   intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
//     // const chatPublicRequest = this.hasChatPublicRequest(req.url);
//     // const builtReq = req.clone({
//     //   url: this.buildUrl(req.url),
//     //   headers: this.buildHeaders(req.headers, chatPublicRequest, req.url),
//     //   withCredentials: false,
//     //   params: req.params ? this.buildParams(req.params) : req.params
//     // });
//     // return next.handle(builtReq).pipe(
//     //   catchError((error: HttpErrorResponse) => {
//     //     if (error.error != null) {
//     //       if (error.status === 401 && chatPublicRequest) {
//     //         return throwError(error);
//     //       }
//     //       if (error.status === 401 && !chatPublicRequest && builtReq.url.startsWith(this.apiUrl)) {
//     //         this.X.showAuth();
//     //       }
//     //       return throwError(error.error);
//     //     } else {
//     //       return throwError(error);
//     //     }
//     //   })
//     // );
//   }

//   protected buildUrl(...args: [url: string, chatApi?: string]) {
//     if (this.validUrl(args[0]) || args[0].startsWith('assets')) {
//       return args[0];
//     }

//     if (args[0].indexOf('/') !== 0) {
//       args[0] = '/' + args[0];
//     }

//     if (!isLocalhost()) {
//       const hasIgnoreZuul = API_RUN_AT_BACKDOOR.some(api => args[0].startsWith(api));
//       if (hasIgnoreZuul) {
//         if (args[0].startsWith(PRIVATE_FILE_PREFIX)) {
//           args[0] = args[0].slice(PRIVATE_FILE_PREFIX.length);
//         } else if (args[0].startsWith(PUBLIC_FILE_PREFIX)) {
//           args[0] = args[0].slice(PUBLIC_FILE_PREFIX.length);
//         }

//         return this.domainService.storageBackdoorAPIUrl + (args[0] ? args[0] : '');
//       }
//     }

//     return this.apiUrl + (args[0] ? args[0] : '');
//   }

//   /**
//    * Temporary fix for Angular Team
//    * https://github.com/angular/angular/issues/18261
//    * @param params
//    */
//   private buildParams(params: HttpParams) {
//     let overridedParams = new HttpParams({ encoder: new CustomEncoder() });
//     params.keys().forEach(key => {
//       overridedParams = overridedParams.set(key, params.get(key));
//     });
//     return overridedParams;
//   }

//   private validUrl(url: string) {
//     return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url);
//   }

//   protected buildHeaders(headers: HttpHeaders, chatApi: string, url: string) {
//     headers = headers || new HttpHeaders();

//     // if (!!chatApi && this.chatService.session != null) {
//     //   const session = this.chatService.session;
//     //   headers = headers.set('Namespace', session.ns).set('Token', `${session.chatUser}:${session.token}`);
//     // } else {
//     //   const orgUuid = this.X.orgUuid;
//     //   const session = this.X.sessionToken;
//     //   //sometime we set org info on api caller
//     //   if (!headers.has(X_B3_HEADER.orgUuid) && !!orgUuid) {
//     //     headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
//     //   }

//     //   if (session) {
//     //     headers = headers.set(X_B3_HEADER.sessionToken, session);
//     //   }
//     // }

//     // api public
//     if (
//       url.indexOf(S3Service.URL_MEDIA_PUBLIC) > -1 ||
//       url.indexOf(MediaService.URL_MEDIA_THUMBNAIL_PUBLIC) > -1 ||
//       url.indexOf(CustomersService.URL_CREATE_TXN) > -1
//     ) {
//       if (headers.has(X_B3_HEADER.sessionToken)) {
//         headers = headers.delete(X_B3_HEADER.sessionToken);
//       }

//       headers = headers.set(X_B3_HEADER.domain, this.domainService.getPortalDomain());
//     }

//     return headers;
//   }
// }
