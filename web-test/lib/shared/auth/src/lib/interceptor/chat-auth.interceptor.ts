// import { HttpEvent, HttpHandler, HttpHeaders, HttpRequest } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { CustomersService } from '@b3networks/api/callcenter';
// import { ChatService, MediaService, S3Service } from '@b3networks/api/workspace';
// import {
//   CHAT_PUBLIC_PREFIX,
//   CHAT_PUBLIC_V2_PREFIX,
//   CHAT_PUBLIC_V3_PREFIX,
//   DomainUtilsService,
//   X_B3_HEADER
// } from '@b3networks/shared/common';
// import { Observable } from 'rxjs';
// import { AuthCookieInterceptor } from './auth-cookie.interceptor';

// @Injectable({ providedIn: 'root' })
// export class ChatAuthInterceptor extends AuthCookieInterceptor {
//   constructor(domainService: DomainUtilsService, private chatService: ChatService) {
//     super(domainService);
//   }

//   override intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
//     const chatPublicRequest = this.hasChatPublicRequest(req.url);

//     return super.intercept(req, next);
//   }

//   protected override buildHeaders(headers: HttpHeaders, chatApi: string, url: string): HttpHeaders {
//     headers = headers || new HttpHeaders();

//     if (!!chatApi && this.chatService.session != null) {
//       const session = this.chatService.session;
//       headers = headers.set('Namespace', session.ns).set('Token', `${session.chatUser}:${session.token}`);
//     } else {
//       const orgUuid = this.X.orgUuid;
//       const session = this.X.sessionToken;
//       //sometime we set org info on api caller
//       if (!headers.has(X_B3_HEADER.orgUuid) && !!orgUuid) {
//         headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
//       }

//       if (session) {
//         headers = headers.set(X_B3_HEADER.sessionToken, session);
//       }
//     }

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

//   private hasChatPublicRequest(url: string) {
//     if (url.indexOf('/') === 0) {
//       url = url.substring(1, url.length - 1);
//     }
//     return url.indexOf(CHAT_PUBLIC_PREFIX) > -1
//       ? CHAT_PUBLIC_PREFIX
//       : url.indexOf(CHAT_PUBLIC_V2_PREFIX) > -1
//       ? CHAT_PUBLIC_V2_PREFIX
//       : url.indexOf(CHAT_PUBLIC_V3_PREFIX) > -1
//       ? CHAT_PUBLIC_V3_PREFIX
//       : null;
//   }
// }
