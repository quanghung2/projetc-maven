import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PortalAppService } from '@b3networks/api/app';
import { AppReleaseVersionService } from '@b3networks/api/gatekeeper';
import { APP_IDS, DomainUtilsService, X } from '@b3networks/shared/common';
import { forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';

declare var CrossPlatformMobile: any;
declare var Android: any;
declare var webkit: any;

@Component({
  selector: 'b3n-public-access',
  templateUrl: './public-access.component.html',
  styleUrls: ['./public-access.component.scss']
})
export class PublicAccessComponent implements OnInit {
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
        tap(({ appVersion, enabledLicenseOnly, isMobileApp, sessionToken, orgUuid, darkMode, isWindows }) => {
          if (!!sessionToken) {
            X.sessionToken = sessionToken;
          }

          if (!!orgUuid) {
            X.orgUuid = orgUuid;
          }

          forkJoin([
            this.portalAppService.fetchAll(X.orgUuid),
            this.releaseVersionService.getReleaseVersion(APP_IDS.PHONE_SETTING)
          ]).subscribe(
            ([potalAppResp, releaseVersion]) => {
              const version = releaseVersion.isHaveNoVersion ? '' : `${releaseVersion.version}`;
              const currentApp = potalAppResp.list.find(app => app.appId === APP_IDS.PHONE_SETTING);
              const hostParams = [`${this.portalLink}`, `${currentApp.path}`, version, `#`];
              const params = [
                `sessionToken=${X.sessionToken}`,
                `orgUuid=${X.orgUuid}`,
                `appVersion=${appVersion ? appVersion : version}`,
                `enabledLicenseOnly=${enabledLicenseOnly ?? 'false'}`,
                `isMobileApp=${isMobileApp ?? 'false'}`,
                `darkMode=${darkMode ?? 'false'}`,
                `isWindows=${isWindows ?? 'false'}`
              ];

              this.link = hostParams.join('/') + '/?' + params.join('&');
              this.srcLink = this.sanitizer.bypassSecurityTrustResourceUrl(this.link);
            },
            err => {
              this.changeTheme(darkMode === 'true');
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
