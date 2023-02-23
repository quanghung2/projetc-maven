import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { DASHBOARD_V2_LOGGED_OUT, DASHBOARD_V2_PREFIX, X } from '@b3networks/shared/common';
import { throwError } from 'rxjs';

@Injectable()
export class DashboardAuthInterceptor extends AuthInterceptor {
  protected override async _handle401Error(request: HttpRequest<unknown>, next: HttpHandler, err: HttpErrorResponse) {
    X.showAuth();

    const hasDashboardV2Request = request.url.includes(DASHBOARD_V2_PREFIX);

    if (err.status === 401 && hasDashboardV2Request) {
      window?.top?.postMessage(DASHBOARD_V2_LOGGED_OUT, '*');
    }

    return throwError(err?.error || err);
  }
}
