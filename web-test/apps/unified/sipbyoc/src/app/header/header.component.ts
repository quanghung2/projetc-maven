import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { SipAccount, SipTrunkQuery, SipTrunkService, TypeSipAccount } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import {
  FeatureQuery,
  FeatureService,
  GetLicenseReq,
  License,
  LicenseResource,
  LicenseService,
  MeService
} from '@b3networks/api/license';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, filter, finalize, switchMap, take, takeUntil } from 'rxjs/operators';
import { MENU_ROUTE_MAPS, RouteMap } from '../shared/contants';

export enum CallMenu {
  active_calls = 'active_calls',
  callback_requests = 'callback_requests'
}

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly MENU_ROUTE_MAPS = MENU_ROUTE_MAPS;

  displayMenus: RouteMap[] = [];
  loading: boolean;

  sips$: Observable<SipAccount[]>;
  selectedSipCtrl = new FormControl();
  isSidebar = true;

  @Output() titleMenuChanged = new EventEmitter<string>();

  private destroySubscriber$ = new Subject<boolean>();
  private destroySip$ = new Subject<boolean>();

  constructor(
    private profileQuery: IdentityProfileQuery,
    private router: Router,
    private route: ActivatedRoute,
    private featureService: FeatureService,
    private featureQuery: FeatureQuery,
    private meLicenseService: MeService,
    private sipTrunkService: SipTrunkService,
    private sipTrunkQuery: SipTrunkQuery,
    private licenseService: LicenseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initSipAccounts();
    this.initMenu();
  }

  ngOnDestroy() {
    this.destroySip$.next(true);
    this.destroySip$.complete();

    this.destroySubscriber$.next(true);
    this.destroySubscriber$.complete();
  }

  compareObjects(o1: SipAccount, o2: SipAccount) {
    return o1.sipUsername === o2.sipUsername;
  }

  selectMenu(menu: RouteMap) {
    this.titleMenuChanged.emit(menu.displayText);
  }

  private initMenu() {
    this.meLicenseService.getFeatures().subscribe(_ => {
      combineLatest([this.profileQuery.currentOrg$, this.featureService.get().pipe(catchError(__ => of([])))])
        .pipe(
          takeUntil(this.destroySubscriber$),
          filter(([org, features]) => org != null && features != null),
          take(1)
        )
        .subscribe(([profileOrg, orgFeatures]) => {
          this.displayMenus = [];
          if (this.featureQuery.hasSIPLicense) {
            this.initSidebarData(profileOrg, orgFeatures);
          } else {
            this.router.navigate(['access-denied']);
          }
        });
    });
  }

  private initSipAccounts() {
    this.sips$ = this.sipTrunkQuery.selectAll();

    let sipPrev;
    this.selectedSipCtrl.valueChanges.subscribe((sipCurrent: SipAccount) => {
      if (sipCurrent.sipUsername !== sipPrev) {
        sipPrev = sipCurrent.sipUsername;
        this.destroySip$.next(true);

        this.sipTrunkService.setActiveSip(sipCurrent.sipUsername);

        this.sipTrunkQuery
          .selectEntity(sipCurrent.sipUsername)
          .pipe(debounceTime(50), takeUntil(this.destroySip$))
          .subscribe(sip => {
            this.selectedSipCtrl.setValue(sip);
          });
      }
    });

    this.sipTrunkService.getAccounts(TypeSipAccount.BYOC_TRUNK).subscribe(sips => {
      if (sips.length > 0 && !!sips[0]?.sipUsername) {
        this.isSidebar = true;
        this.selectedSipCtrl.setValue(sips[0]);
        this.sipTrunkService.setActiveSip(sips[0].sipUsername);
      } else {
        this.isSidebar = false;
        this.router.navigate(['access-denied']);
      }
      this.initLicense(sips); // fetch number for sipUsername to display label
    });
  }

  private initLicense(sips: SipAccount[]) {
    this.loading = true;
    const req = <GetLicenseReq>{
      skus: ['9f2e2a7d-6d2b-45a6-ac01-b681e0a728e5'],
      identityUuid: null,
      resourceKey: null,
      includeMappings: true,
      includeResources: true,
      hasResource: null,
      hasUser: null,
      teamUuid: null
    };

    this.licenseService
      .getLicenses(req, new Pageable(0, 1000))
      .pipe(
        switchMap(page => {
          const mappings: License[] = [];
          page.content.forEach(l => {
            l.mappings.forEach(m => {
              if (m.isNumber) {
                mappings.push(m);
              }
            });
          });

          return combineLatest([
            of(page.content),
            mappings.length ? this.licenseService.getResource(mappings.map(m => m.id)) : of([])
          ]);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(([mappings, resources]: [License[], LicenseResource[]]) => {
        const updateSips: SipAccount[] = [];
        sips.forEach(sip => {
          const findMapping = mappings.find(x => x?.resource?.key === sip.sipUsername);
          if (findMapping) {
            const listMappingIds = findMapping.mappings.map(x => x.id);
            const filterNumbers = resources.filter(r => listMappingIds.includes(r.licenseId));
            updateSips.push(
              new SipAccount({
                ...sip,
                numbers: filterNumbers.map(x => x.info.number)
              })
            );
          }
        });
        if (updateSips.length > 0) {
          updateSips.forEach(item => {
            this.sipTrunkService.updateAccount(item.sipUsername, item);
          });
        }
      });
  }

  private initSidebarData(profileOrg: ProfileOrg, _: string[]) {
    // const menus: RouteMap[] = [MENU_ROUTE_MAPS.account, MENU_ROUTE_MAPS.security, MENU_ROUTE_MAPS.high_availability];
    const menus: RouteMap[] = [MENU_ROUTE_MAPS.account, MENU_ROUTE_MAPS.security, MENU_ROUTE_MAPS.incoming_setting];

    this.displayMenus = menus.sort((a, b) => a.order - b.order);

    if (!this.route.firstChild && this.displayMenus.length) {
      this.titleMenuChanged.emit(this.displayMenus[0].displayText);
      this.router.navigateByUrl(this.displayMenus[0].urlPath);
    }
  }
}
