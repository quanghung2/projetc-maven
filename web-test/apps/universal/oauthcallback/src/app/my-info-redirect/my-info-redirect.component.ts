import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MyInfoRedirectService, OriginalDomainResponse } from './my-info-redirect.service';

@Component({
  selector: 'b3n-my-info-redirect',
  templateUrl: './my-info-redirect.component.html',
  styleUrls: ['./my-info-redirect.component.scss']
})
export class MyInfoRedirectComponent implements OnInit {
  loading = true;
  remainTime = 10;
  intervalTime: any;
  originalDomain: OriginalDomainResponse;
  hasData: boolean;
  errorMessage: string;

  constructor(private myInfoService: MyInfoRedirectService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        switchMap(params => {
          this.getErrorMessageFromUrl(params['error-description']);

          if (params && params['code'] && params['state']) {
            this.loading = true;
            return this.myInfoService.fetOriginalDomain(params['code'], params['state']);
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
                this.handleRediectLink(this.originalDomain.originUrl);
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
    this.handleRediectLink(this.originalDomain.originUrl);
  }

  private handleRediectLink(url: string) {
    if (this.intervalTime) {
      clearInterval(this.intervalTime);
    }
    window.location.replace(url);
  }

  private getErrorMessageFromUrl(errorDescription = '') {
    const description = decodeURIComponent(errorDescription);
    if (description) {
      this.errorMessage = description;
    }
  }
}
