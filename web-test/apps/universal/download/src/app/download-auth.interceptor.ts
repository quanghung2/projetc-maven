import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DownloadAuthInterceptor extends AuthInterceptor {
  protected override async _handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler,
    err: HttpErrorResponse
  ): Promise<Observable<never>> {
    const loginLink =
      'https://' + this.domainService.portalDomain + '#/auth/login?redirectUrl=' + encodeURIComponent(location.href);
    window.location.replace(loginLink);
    return throwError(err);
  }
}
