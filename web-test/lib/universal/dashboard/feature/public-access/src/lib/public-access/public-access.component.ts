import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PortalAppService } from '@b3networks/api/app';
import { AuthenticatedAccessLink } from '@b3networks/api/dashboard';
import { AppReleaseVersionService } from '@b3networks/api/gatekeeper';
import { APP_IDS, DomainUtilsService, X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PinPromtComponent } from '../pin-promt/pin-promt.component';

@Component({
  selector: 'b3n-public-access',
  templateUrl: './public-access.component.html',
  styleUrls: ['./public-access.component.scss']
})
export class PublicAccessComponent implements OnInit {
  ref: string;
  pinCode: string;

  linkData: AuthenticatedAccessLink;
  dashboardLink: SafeResourceUrl;

  portalLink: string;

  constructor(
    private releaseVersionService: AppReleaseVersionService,
    private portalAppService: PortalAppService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private spinner: LoadingSpinnerSerivce,
    private domainUtil: DomainUtilsService
  ) {
    this.portalLink = `https://${this.domainUtil.getPortalDomain()}`;
  }

  ngOnInit() {
    this.ref = this.route.snapshot.params['ref'];
    this.pinCode = this.route.snapshot.params['code'];

    setTimeout(() => {
      this.dialog
        .open(PinPromtComponent, {
          width: '400px',
          data: { ref: this.ref, pin: this.pinCode }
        })
        .afterClosed()
        .subscribe(data => {
          if (!!data) {
            this.linkData = data;

            X.orgUuid = this.linkData.orgUuid;
            X.sessionToken = this.linkData.sessionToken;

            this.spinner.showSpinner();
            forkJoin([
              this.portalAppService.fetchAll(),
              this.releaseVersionService.getReleaseVersion(APP_IDS.DASHBOARD)
            ])
              .pipe(finalize(() => this.spinner.hideSpinner()))
              .subscribe(([potalAppResp, releaseVersion]) => {
                const currentApp = potalAppResp.list.find(app => app.appId === APP_IDS.DASHBOARD);

                const applicationPath =
                  currentApp.path + (releaseVersion.isHaveNoVersion ? '' : `/${releaseVersion.version}`);

                const hostParams = [
                  `${this.portalLink}`,
                  `${applicationPath}`,
                  `#`,

                  // `http://localhost:4200`, // localhost to testing

                  `dashboard`,
                  `${this.linkData.dashboardUuid}`
                ];

                const params = [
                  `orgUuid=${this.linkData.orgUuid}`,
                  `sessionToken=${this.linkData.sessionToken}`,
                  `mode=public`
                ];

                const link = hostParams.join('/') + '?' + params.join('&');

                this.dashboardLink = this.sanitizer.bypassSecurityTrustResourceUrl(link);
              });
          }
        });
    }, 0);
  }
}
