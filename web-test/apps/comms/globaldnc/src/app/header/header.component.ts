import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { CacheService } from '../shared';
import { CompliantFlagService } from '../shared/service/compliant-flag.service';

@Component({
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})
export class HeaderComponent implements OnInit {
  activeComponent: EnumTypeMenu;
  subscriptionInfo: any;
  enumTypeMenu = EnumTypeMenu;
  isCompliantFlag = false;

  constructor(
    private cacheService: CacheService,
    private router: Router,
    private compliantFlagService: CompliantFlagService
  ) {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        map(e => e as NavigationEnd)
      )
      .subscribe(e => {
        if (e.url.includes('compliance-window')) {
          this.activeComponent = EnumTypeMenu.ComplianceWindow;
        } else if (e.url.includes('list-management')) {
          this.activeComponent = EnumTypeMenu.ListManagement;
        } else if (e.url.includes('org-links')) {
          this.activeComponent = EnumTypeMenu.OrgLinks;
        } else if (e.url.includes('check-number')) {
          this.activeComponent = EnumTypeMenu.CheckNumber;
        } else if (e.url.includes('user-management')) {
          this.activeComponent = EnumTypeMenu.UserManagement;
        } else if (e.url.includes('admin-tools')) {
          this.activeComponent = EnumTypeMenu.AdminTools;
        } else if (e.url.includes('landing')) {
          this.activeComponent = EnumTypeMenu.Landing;
        } else if (this.router.url.includes('compliant-flag')) {
          this.activeComponent = EnumTypeMenu.CompliantFlag;
        }
      });

    if (this.cacheService.containKey('subscription-info')) {
      this.subscriptionInfo = this.cacheService.get('subscription-info');
    }
  }

  ngOnInit() {
    this.checkCompliantFlag();
    if (this.router.url.includes('compliance-window')) {
      this.activeComponent = EnumTypeMenu.ComplianceWindow;
    } else if (this.router.url.includes('list-management')) {
      this.activeComponent = EnumTypeMenu.ListManagement;
    } else if (this.router.url.includes('org-links')) {
      this.activeComponent = EnumTypeMenu.OrgLinks;
    } else if (this.router.url.includes('check-number')) {
      this.activeComponent = EnumTypeMenu.CheckNumber;
    } else if (this.router.url.includes('user-management')) {
      this.activeComponent = EnumTypeMenu.UserManagement;
    } else if (this.router.url.includes('admin-tools')) {
      this.activeComponent = EnumTypeMenu.AdminTools;
    } else if (this.router.url.includes('landing')) {
      this.activeComponent = EnumTypeMenu.Landing;
    } else if (this.router.url.includes('compliant-flag')) {
      this.activeComponent = EnumTypeMenu.CompliantFlag;
    }
  }

  checkCompliantFlag() {
    this.compliantFlagService.getInfoCompliance().subscribe(
      res => (this.isCompliantFlag = true),
      err => (this.isCompliantFlag = false)
    );
  }
}

export enum EnumTypeMenu {
  ComplianceWindow = 'ComplianceWindow',
  ListManagement = 'ListManagement',
  OrgLinks = 'OrgLinks',
  CheckNumber = 'CheckNumber',
  UserManagement = 'UserManagement',
  AdminTools = 'AdminTools',
  Landing = 'Landing',
  CompliantFlag = 'compliant-flag'
}
