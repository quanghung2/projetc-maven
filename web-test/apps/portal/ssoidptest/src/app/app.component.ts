import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SsoService, VerifyJWtResp } from '@b3networks/api/auth';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { of, timer } from 'rxjs';
import { filter, takeUntil, takeWhile, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  readonly appId = '5hXSB78JSubOssiL';

  loading: boolean;
  loggedInInfo: VerifyJWtResp;
  counter = 5;
  url: string;

  constructor(private ssoService: SsoService, private route: ActivatedRoute, private router: Router) {
    super();
  }

  ngOnInit() {
    console.log('test inited');
    this.loading = true;
    this.loggedInInfo = JSON.parse(localStorage.getItem('loggedInInfo'));
    if (this.loggedInInfo) {
      this.loading = false;
      return;
    }

    this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(_ => {
        if (!this.route.firstChild) {
          const params = this.route.snapshot.queryParams;
          console.log('firstChild: ', params);

          const token = params['token'];
          (token ? this.ssoService.verifyJWT(token, this.appId) : of(null)).subscribe(resp => {
            if (resp) {
              this.loggedInInfo = resp;
              localStorage.setItem('loggedInInfo', JSON.stringify(resp));
              this.loading = false;
              return;
            }

            this.renderUrl();
            this.countDown();
          });
        }
      });
  }

  redirectLink($event) {
    $event.stopPropagation();
    $event.preventDefault();

    this.loading = false;
    window.parent.location.replace(this.url);
  }

  renderUrl() {
    const redirectUri = encodeURIComponent(window.parent.location.href);
    this.url = `${window.parent.location.origin}/#/${X.orgUuid}/sso?app_id=${this.appId}&redirect_uri=${redirectUri}`;
    console.log('this.url: ', this.url);
  }

  countDown() {
    timer(1000, 1000)
      .pipe(
        takeWhile(() => this.counter > 0),
        tap(() => this.counter--)
      )
      .subscribe(() => {
        if (this.counter === 0) {
          this.loading = false;
          window.parent.location.replace(this.url);
        }
      });
  }
}
