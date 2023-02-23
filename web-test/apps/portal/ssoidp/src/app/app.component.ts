import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { GetJwtReq, SsoService } from '@b3networks/api/auth';
import { buildUrlParameter, X } from '@b3networks/shared/common';
import { forkJoin, Subscription, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading: boolean;
  showErrorMessage: boolean;
  params: { app_id; redirect_uri };

  private _redirect$: Subscription;

  constructor(private ssoService: SsoService) {}

  ngOnInit() {
    this.params = buildUrlParameter() as { app_id; redirect_uri };

    this.loading = true;

    if (!X.orgUuid) {
      const _this = this;
      X.getCredentialsInfoEventListener(data => {
        console.log(`received data from portal `, data);
        this._redirect$.unsubscribe();
        this._redirect$ = null;

        if (data && !!data.orgUuid) {
          X.orgUuid = data.orgUuid;
          _this._verifyToken();
        }
      });

      X.getCredentialsInfo();

      this._redirect$ = timer(5000).subscribe(_ => {
        let params = new HttpParams();
        Object.keys(this.params).forEach(key => {
          params = params.set(key, this.params[key]);
        });
        const ssoApp = location.origin + '/#/sso?' + params.toString();

        console.log(`Redirecting to ${ssoApp}`);

        if (window.top) {
          window.top.location.replace(ssoApp);
        } else {
          window.location.replace(ssoApp);
        }
      });
    } else {
      this._verifyToken();
    }
  }

  private _verifyToken() {
    const req = { appId: this.params.app_id } as GetJwtReq;

    forkJoin([this.ssoService.getAppByAppId(this.params.app_id), this.ssoService.getJWT(req)])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        ([app, resp]) => {
          const param = new HttpParams().set('token', resp.token).set('org_uuid', X.orgUuid);
          let url = app.appConfigUrl?.redirectUrl || location.href;
          url += (url.split('?')[1] ? '&' : '?') + param.toString();
          console.log(`Redirecting to ${url}`);

          window.location.replace(url);
        },
        error => {
          console.log(error);
          this.loading = false;
          this.showErrorMessage = true;
        }
      );
  }
}
