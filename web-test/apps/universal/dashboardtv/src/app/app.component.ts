import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PortalAppService } from '@b3networks/api/app';
import { DeviceAccessToken, DeviceOTP, DevicesService } from '@b3networks/api/auth';
import { AppReleaseVersionService } from '@b3networks/api/gatekeeper';
import {
  APP_IDS,
  DASHBOARD_V2_LOGGED_OUT,
  DestroySubscriberComponent,
  DEVICE_ACCESS_TOKEN,
  DomainUtilsService,
  X
} from '@b3networks/shared/common';
import { defer, firstValueFrom, forkJoin, interval, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, filter, first, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  portalLink: string;
  deviceOTP: DeviceOTP;
  approved: boolean;
  dashboardLink: SafeResourceUrl;
  deviceAccessToken: DeviceAccessToken;

  destroyAccessTokenLoop$ = new Subject<boolean>();

  constructor(
    private domainUtil: DomainUtilsService,
    private devicesService: DevicesService,
    private portalAppService: PortalAppService,
    private releaseVersionService: AppReleaseVersionService,
    private sanitizer: DomSanitizer
  ) {
    super();
    this.portalLink = `https://${this.domainUtil.getPortalDomain()}`;
  }

  async ngOnInit() {
    window.onmessage = e => {
      if (e.data === DASHBOARD_V2_LOGGED_OUT) {
        this.resetFlow();
      }
    };

    const deviceAccessTokenStored = localStorage.getItem(DEVICE_ACCESS_TOKEN);

    if (deviceAccessTokenStored) {
      this.deviceAccessToken = JSON.parse(deviceAccessTokenStored);

      const { orgUuid, resourceIds, deviceId } = this.deviceAccessToken;

      if (orgUuid && resourceIds?.length && deviceId) {
        this.renderIframe(orgUuid, resourceIds, deviceId);
      } else {
        this.mainLoop();
      }

      return;
    }

    this.mainLoop();
  }

  async mainLoop() {
    const deviceId = await firstValueFrom(this.devicesService.getDeviceId());
    const otpLoop$: Observable<DeviceOTP | null> = defer(() => {
      return this.approved ? of(null) : this.devicesService.getDeviceOTP(deviceId);
    }).pipe(
      tap(deviceOTP => {
        this.resetAccessTokenLoop();

        if (!deviceOTP) {
          return;
        }

        this.deviceOTP = deviceOTP;

        interval(1000)
          .pipe(
            takeUntil(this.destroyAccessTokenLoop$),
            tap(async _ => {
              this.deviceAccessToken = await firstValueFrom(
                this.devicesService.getDeviceAccessToken(deviceId, this.deviceOTP.code)
              );

              if (this.deviceAccessToken) {
                const { orgUuid, resourceIds } = this.deviceAccessToken;
                await firstValueFrom(this.devicesService.registerDevice(deviceId, this.deviceOTP.code));
                this.renderIframe(orgUuid, resourceIds, deviceId);
              }
            })
          )
          .subscribe();
      }),
      filter(deviceOTP => !!deviceOTP),
      switchMap(deviceOTP => {
        return interval(deviceOTP.secToExpire * 1000).pipe(
          first(),
          switchMap(_ => otpLoop$)
        );
      }),
      catchError(e => {
        this.resetAccessTokenLoop();
        return throwError(e);
      })
    );

    otpLoop$.subscribe();
  }

  resetAccessTokenLoop() {
    this.destroyAccessTokenLoop$.next(true);
    this.destroyAccessTokenLoop$.complete();
    this.destroyAccessTokenLoop$ = new Subject<boolean>();
  }

  renderIframe(orgUuid: string, resourceIds: string[], deviceId: string) {
    X.orgUuid = orgUuid;
    this.approved = true;

    this.resetAccessTokenLoop();

    forkJoin([this.portalAppService.fetchAll(), this.releaseVersionService.getReleaseVersion(APP_IDS.DASHBOARD)])
      .pipe(
        tap(([potalAppResp, releaseVersion]) => {
          const currentApp = potalAppResp.list.find(app => app.appId === APP_IDS.DASHBOARD);
          const applicationPath =
            currentApp.path + (releaseVersion.isHaveNoVersion ? '' : `/${releaseVersion.version}`);
          const hostParams = [`${this.portalLink}`, `${applicationPath}`, `#/`];
          const params = [`orgUuid=${orgUuid}`, `resourceIds=${resourceIds.join(',')}`, `deviceId=${deviceId}`];
          const link = hostParams.join('/') + '?' + params.join('&');

          this.dashboardLink = this.sanitizer.bypassSecurityTrustResourceUrl(link);
          delete this.deviceAccessToken.sessionToken;
          this.deviceAccessToken.deviceId = deviceId;
          localStorage.setItem(DEVICE_ACCESS_TOKEN, JSON.stringify(this.deviceAccessToken));
        }),
        catchError(e => {
          this.resetFlow();
          return throwError(e);
        })
      )
      .subscribe();
  }

  resetFlow() {
    this.approved = false;
    localStorage.removeItem(DEVICE_ACCESS_TOKEN);
    this.mainLoop();
  }
}
