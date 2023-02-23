import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Application, PortalAppService } from '@b3networks/api/app';
import { AuthenticationService } from '@b3networks/api/auth';
import { AppReleaseVersionService } from '@b3networks/api/gatekeeper';
import { DomainUtilsService, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-sso-page',
  templateUrl: './sso-page.component.html',
  styleUrls: ['./sso-page.component.scss']
})
export class SsoPageComponent implements OnInit {
  domain: string;
  appId: string;
  orgUuid: string;
  src: SafeResourceUrl;
  authenticating: boolean;
  redirecting: boolean;
  loaded: boolean;
  currentApp: Application;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private appService: PortalAppService,
    private sanitizer: DomSanitizer,
    private toastService: ToastService,
    private releaseVersionService: AppReleaseVersionService,
    private domainUtils: DomainUtilsService
  ) {}

  ngOnInit() {
    this.authenticating = true;
    this.domain = this.domainUtils.getPortalDomain();

    setTimeout(() => {
      this.route.queryParams
        .pipe(
          switchMap(query => {
            this.appId = query.appId;
            this.orgUuid = query.orgUuid;
            return this.authService.checkAuth(query.ssoToken, this.orgUuid, this.appId);
          }),
          switchMap(auth => {
            X.orgUuid = auth.orgUuid;
            X.sessionToken = auth.sessionToken;
            return forkJoin([this.appService.fetchAll(), this.releaseVersionService.getReleaseVersion(this.appId)]);
          })
        )
        .subscribe(
          ([apps, releaseVersion]) => {
            const app = apps.list.find(a => a.appId === this.appId);
            if (!app) {
              this.loaded = true;
              this.toastService.error(`No applications found.`);
              return;
            }
            this.currentApp = app;
            this.authenticating = false;
            this.redirecting = true;
            setTimeout(() => {
              const appPath = app.sourceLocation.endsWith('/')
                ? app.sourceLocation.substr(0, app.sourceLocation.length - 1)
                : app.sourceLocation;

              const hostParams = [`https://${this.domain}`, appPath];
              if (!releaseVersion.isHaveNoVersion) {
                hostParams.push(releaseVersion.version);
              }
              const params = [
                `portalDomain=${this.domain}`,
                `orgUuid=${X.getContext()['orgUuid']}`,
                `sessionToken=${X.getContext()['sessionToken']}`
              ];
              const link = hostParams.join('/') + '/?' + params.join('&');
              this.redirecting = false;
              this.loaded = true;
              this.src = this.sanitizer.bypassSecurityTrustResourceUrl(link);
            }, 2000);
          },
          error => {
            this.loaded = true;
            this.toastService.error(error.message || `Cannot access the application!`);
          }
        );
    }, 1200);
  }
}
