import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AppReleaseVersionService } from '@b3networks/api/gatekeeper';
import { APP_IDS, DomainUtilsService } from '@b3networks/shared/common';
import { tap } from 'rxjs/operators';

declare let CrossPlatformMobile: any;
declare let Android: any;
declare let webkit: any;

@Component({
  selector: 'b3n-public-support-center',
  templateUrl: './public-support-center.component.html',
  styleUrls: ['./public-support-center.component.scss']
})
export class PublicSupportCenterComponent implements OnInit {
  portalLink: string;
  srcLink: SafeResourceUrl;
  link: string;
  error: string;

  constructor(
    private sanitizer: DomSanitizer,
    private domainUtil: DomainUtilsService,
    private route: ActivatedRoute,
    private releaseVersionService: AppReleaseVersionService
  ) {
    this.portalLink = `https://${this.domainUtil.getPortalDomain()}`;
  }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        tap(params => {
          this.releaseVersionService.getReleaseVersion(APP_IDS.SUPPORT_CENTER).subscribe(
            releaseVersion => {
              const version = releaseVersion.isHaveNoVersion ? '' : `${releaseVersion.version}`;
              const hostParams = [`${this.portalLink}`, `support-center`, version, `#`];
              let searchParams = '';
              Object.keys(params).forEach(key => {
                if (params[key]) {
                  if (searchParams) {
                    searchParams = searchParams + '&' + `${key}=${params[key]}`;
                  } else {
                    searchParams = `${key}=${params[key]}`;
                  }
                }
              });
              if (!params['appVersion']) {
                searchParams = searchParams + '&' + `appVersion=${version}`;
              }

              this.link = hostParams.join('/') + '/?' + searchParams;
              this.srcLink = this.sanitizer.bypassSecurityTrustResourceUrl(this.link);
            },

            err => {
              this.changeTheme(params['darkMode'] === 'true');
              this.error = err.message;
            }
          );
        })
      )
      .subscribe();
  }

  close() {
    this.fireMsgOut({
      action: 'close',
      status: 'success'
    });
  }

  fireMsgOut(msg) {
    // for IOS
    try {
      if (typeof webkit !== 'undefined' && webkit !== null) {
        webkit.messageHandlers.callbackHandler.postMessage(msg);
      }
    } catch (err) {}

    try {
      if (typeof CrossPlatformMobile !== 'undefined' && CrossPlatformMobile !== null) {
        CrossPlatformMobile.postMessage(JSON.stringify(msg));
      }
    } catch (err) {}

    // for android
    try {
      if (typeof Android !== 'undefined' && Android !== null) {
        Android.closeWebView(msg);
      }
    } catch (err) {}
  }

  changeTheme(darkMode: boolean) {
    const bodyElement = document.body;

    if (bodyElement) {
      bodyElement.classList.remove(darkMode ? 'theme-default' : 'theme-dark');
      bodyElement.classList.add(darkMode ? 'theme-dark' : 'theme-default');
    }
  }
}
