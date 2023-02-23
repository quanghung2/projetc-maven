import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { GeoService, ProfileService } from '@b3networks/api/auth';
import { CustomersService, UIConfig } from '@b3networks/api/callcenter';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  initState$: Observable<boolean>;
  constructor(
    private domSanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private matIconRegistry: MatIconRegistry,
    private router: Router,
    private customersService: CustomersService,
    private geoService: GeoService,
    private socialAuthService: SocialAuthService,
    private profileService: ProfileService
  ) {
    this.initState$ = this.socialAuthService.initState;
  }

  ngOnInit(): void {
    this.geoService.getGeoInfo().subscribe();
    this.registerCustomIcons();

    this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(_ => {
      const params = this.route.snapshot.queryParams;
      console.log('params: ', params);
      if (params?.['orgUuid']) {
        this.customersService.updateUI(<UIConfig>{
          domain: params?.['domain'],
          titleDomain: params?.['title'],
          queueUuid: params?.['queueUuid'],
          botId: params?.['botId'],
          livechatId: params?.['livechatId'],
          isOpenChat: params?.['isOpen'] === 'true',
          widgetUuid: params?.['widgetUuid'],
          isInboxFlow: !!params?.['widgetUuid']
        });
      }
    });
  }

  private registerCustomIcons() {
    const icons = [{ name: 'contact', icon: 'assets/icons/launcher_button.svg' }];

    icons.forEach(x => {
      const url = this.domSanitizer.bypassSecurityTrustResourceUrl(x.icon);
      this.matIconRegistry.addSvgIcon(x.name, url);
    });
  }
}
