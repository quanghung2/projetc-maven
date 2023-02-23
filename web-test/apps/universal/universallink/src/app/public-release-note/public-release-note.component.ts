import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PortalAppService } from '@b3networks/api/app';
import { AppReleaseVersionService } from '@b3networks/api/gatekeeper';
import { APP_IDS, DomainUtilsService } from '@b3networks/shared/common';
import { tap } from 'rxjs/operators';

declare var CrossPlatformMobile: any;
declare var Android: any;
declare var webkit: any;

@Component({
  selector: 'b3n-public-release-note',
  templateUrl: './public-release-note.component.html',
  styleUrls: ['./public-release-note.component.scss']
})
export class PublicReleaseNoteComponent implements OnInit {
  portalLink: string;
  srcLink: SafeResourceUrl;
  link: string;
  error: string;

  constructor(
    private sanitizer: DomSanitizer,
    private domainUtil: DomainUtilsService,
    private route: ActivatedRoute,
    private releaseVersionService: AppReleaseVersionService,
    private portalAppService: PortalAppService
  ) {
    this.portalLink = `https://${this.domainUtil.getPortalDomain()}`;
  }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        tap(params => {
          this.releaseVersionService.getReleaseVersion(APP_IDS.RELEASE_NOTE).subscribe(
            releaseVersion => {
              const version = releaseVersion.isHaveNoVersion ? '' : `${releaseVersion.version}`;
              const hostParams = [`${this.portalLink}`, `release-note`, version, `#`];
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
