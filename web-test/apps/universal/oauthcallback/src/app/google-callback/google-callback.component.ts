import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OriginalDomainResponse } from '../my-info-redirect/my-info-redirect.service';
import { GoogleRedirectService } from './google-callback.service';

@Component({
  selector: 'b3n-google-callback',
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.scss']
})
export class GoogleCallbackComponent implements OnInit {
  loading = true;
  remainTime = 10;
  intervalTime: any;
  originalDomain: OriginalDomainResponse;
  hasData: boolean;

  constructor(private googleRedirectService: GoogleRedirectService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        switchMap(params => {
          console.log(params);
          if (params && params['code'] && params['state']) {
            this.loading = true;
            return this.googleRedirectService.fetchOriginalDomain(params['code'], params['state']);
          }
          return of(null);
        })
      )
      .subscribe(
        (data: OriginalDomainResponse) => {
          this.loading = false;
          if (data) {
            this.hasData = true;
            this.originalDomain = data;
            this.intervalTime = setInterval(() => {
              this.remainTime--;
              if (this.remainTime === 0) {
                this.handleRedirectLink(this.originalDomain.originUrl);
              }
            }, 1000);
          } else {
            this.hasData = false;
          }
        },
        _ => {}
      );
  }

  redirectLink() {
    this.handleRedirectLink(this.originalDomain.originUrl);
  }

  private handleRedirectLink(url: string) {
    if (this.intervalTime) {
      clearInterval(this.intervalTime);
    }
    window.location.replace(url);
  }
}
