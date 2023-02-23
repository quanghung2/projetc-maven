import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MsLoginRedirectService, OrginalDataResp } from './mslogin-callback.service';

@Component({
  selector: 'b3n-msteams-callback',
  templateUrl: './mslogin-callback.component.html',
  styleUrls: ['./mslogin-callback.component.scss']
})
export class MsloginCallbackComponent implements OnInit {
  loading = true;
  remainTime = 10;
  intervalTime: any;
  originalData: OrginalDataResp;
  hasData: boolean;
  state: string;
  code: string;
  url: string;

  constructor(private msLoginRedirectService: MsLoginRedirectService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        switchMap(params => {
          this.state = params['state'];
          this.code = params['code'];
          if (params && this.state && this.code) {
            this.loading = true;
            return this.msLoginRedirectService.getOriginalUrl(params['state']);
          }
          return of(null);
        })
      )
      .subscribe({
        next: (data: OrginalDataResp) => {
          this.loading = false;
          this.hasData = !!data;
          if (this.hasData) {
            this.originalData = data;
            this.checkDeviceTypeAndRedirect();
          }
        },
        error: () => {
          this.loading = false;
          this.hasData = false;
        }
      });
  }

  checkDeviceTypeAndRedirect() {
    if (this.originalData.deviceType === 'web') {
      this.getUrlWithQueryParams();

      setTimeout(() => {
        this.handleRedirectLink(this.url);
      }, 1200);
    } else {
      window.location.href = `cpaas://oauth/ms/?state=${this.state}&code=${this.code}`;
    }
  }

  getUrlWithQueryParams() {
    const param = new HttpParams().set('state', this.state).set('code', this.code);
    this.url = this.originalData.srcUrl;
    this.url += (this.url.split('?')[1] ? '&' : '?') + param.toString();
  }

  redirectLink() {
    this.handleRedirectLink(this.url);
  }

  private handleRedirectLink(url: string) {
    if (this.intervalTime) {
      clearInterval(this.intervalTime);
    }
    window.location.replace(url);
  }
}
