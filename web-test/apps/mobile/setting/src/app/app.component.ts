import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileOrg } from '@b3networks/api/auth';
import { ExtensionService, MeService } from '@b3networks/api/callcenter';
import { GetLicenseReq, LicenseService } from '@b3networks/api/license';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { CookieService, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { forkJoin } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { AppStateService } from './shared/state/app-state.service';

const MOBILE_COOKIE = 'mobile';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  // OrgUuid before switch to new org
  prevOrgUuid: string;
  orgUuid: string;
  init: boolean;
  isHomeScreen: boolean;

  constructor(
    private extensionService: ExtensionService,
    private licenseService: LicenseService,
    private appStateService: AppStateService,
    private meService: MeService,
    private sessionService: SessionService,
    private sessionQuery: SessionQuery,
    private route: ActivatedRoute,
    private cookieService: CookieService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    const init$ = this.renderInit();

    this.route.queryParams
      .pipe(
        filter(params => !!params),
        tap(({ orgUuid }) => {
          this.isHomeScreen = !!orgUuid;
          let validateOrgUuid = '';

          if (orgUuid) {
            this.cookieService.set(MOBILE_COOKIE, JSON.stringify({ orgUuid }));
            validateOrgUuid = orgUuid;
          } else {
            const mobileCookie = this.cookieService.get(MOBILE_COOKIE);

            if (!mobileCookie) {
              return;
            }

            validateOrgUuid = JSON.parse(mobileCookie)['orgUuid'];
          }

          if (!validateOrgUuid) {
            return;
          }

          this.orgUuid = validateOrgUuid;
          X.orgUuid = validateOrgUuid;

          if (!this.init) {
            this.init = true;
            init$.subscribe();
          }
        })
      )
      .subscribe();
  }

  renderInit() {
    return this.sessionQuery.currentOrg$.pipe(
      takeUntil(this.destroySubscriber$),
      map(org => org ?? new ProfileOrg({ orgUuid: '' })),
      filter(currentOrg => !!currentOrg),
      tap(currentOrg => {
        if (this.prevOrgUuid === currentOrg.orgUuid) {
          return;
        }

        this.prevOrgUuid = currentOrg.orgUuid;

        if (this.prevOrgUuid) {
          X.orgUuid = this.prevOrgUuid;

          forkJoin([this.meService.get(), this.extensionService.getAllExtenison(false)])
            .pipe(
              tap(async ([_, exts]) => {
                const currentExt = exts.find(ext => ext.identityUuid === this.sessionQuery.profile.uuid);

                if (!currentExt) {
                  this.extensionService.setActive('');
                  return;
                }

                await this.extensionService.getDetails(currentExt.extKey).toPromise();

                await this.licenseService
                  .getLicenses(<GetLicenseReq>{ resourceKey: currentExt.extKey })
                  .pipe(
                    map(page => page.content),
                    tap(licenses => {
                      let featureCodes: string[] = [];

                      if (licenses.length) {
                        featureCodes.push(...licenses[0].featureCodes);
                        featureCodes.push(
                          ...licenses[0].mappings.map(m => m.featureCodes).reduce((a, b) => a.concat(b), [])
                        );
                      }

                      featureCodes = [...new Set(featureCodes)];
                      this.appStateService.udpateAppState({ assignedFeatureCodes: featureCodes });
                    })
                  )
                  .toPromise();

                this.extensionService.setActive(currentExt.extKey);

                if (!this.isHomeScreen) {
                  return;
                }

                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: { orgUuid: this.prevOrgUuid },
                  queryParamsHandling: 'merge'
                });
              })
            )
            .subscribe();
        } else {
          this.sessionService.getProfile(this.orgUuid).subscribe(
            () => {},
            err => {
              this.sessionService.error$.next(err.message);
            }
          );
        }
      })
    );
  }
}
