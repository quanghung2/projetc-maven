import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IamService, IAM_GROUP_UUIDS, IdentityProfileQuery, MeIamService } from '@b3networks/api/auth';
import { SipAccount } from '@b3networks/api/callcenter';
import { PersonalWhitelistService } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
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
export class HeaderComponent extends DestroySubscriberComponent implements OnInit {
  displayMenus: RouteMap[] = [];
  loading: boolean;
  activeLink: RouteMap;

  sips$: Observable<SipAccount[]>;
  selectedSipCtrl = new FormControl();
  isSidebar = true;

  @Output() titleMenuChanged = new EventEmitter<string>();

  constructor(
    private profileQuery: IdentityProfileQuery,
    private router: Router,
    private route: ActivatedRoute,
    private iamService: IamService,
    private personalWhitelistService: PersonalWhitelistService,
    private meIamService: MeIamService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initMenu();
  }

  selectMenu(menu: RouteMap) {
    this.activeLink = menu;
    this.router.navigate([menu.urlPath]);
    this.titleMenuChanged.emit(menu.displayText);
  }

  private initMenu() {
    this.profileQuery.profile$
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$),
        take(1)
      )
      .subscribe(profile => {
        combineLatest([
          this.meIamService.getAssignedGroup(),
          this.personalWhitelistService.getByIdentityUuid(profile.uuid)
        ]).subscribe(([groups, personal]) => {
          const menus: RouteMap[] = [];
          if (groups?.some(group => group.uuid === IAM_GROUP_UUIDS.contact)) {
            menus.push(MENU_ROUTE_MAPS.company);
          }
          if (personal?.enabled) {
            menus.push(MENU_ROUTE_MAPS.personal);
          }

          this.displayMenus = menus.sort((a, b) => a.order - b.order);

          if (!this.route.firstChild && this.displayMenus.length) {
            this.titleMenuChanged.emit(this.displayMenus[0].displayText);
            this.activeLink = this.displayMenus[0];
            this.router.navigateByUrl(this.displayMenus[0].urlPath);
          }
        });
      });
  }
}
