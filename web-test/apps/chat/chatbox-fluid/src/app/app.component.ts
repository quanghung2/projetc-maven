import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { GeoService } from '@b3networks/api/auth';
import { PartnerQuery, PartnerService } from '@b3networks/api/partner';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  initState$: Observable<boolean>;

  constructor(
    private domSanitizer: DomSanitizer,
    private matIconRegistry: MatIconRegistry,
    private socialAuthService: SocialAuthService,
    private geoService: GeoService,
    private partnerService: PartnerService,
    private partnerQuery: PartnerQuery
  ) {
    super();
    this.initState$ = this.socialAuthService.initState;
  }

  ngOnInit(): void {
    this.setFavicon();
    this.geoService.getGeoInfo().subscribe();
    this.registerCustomIcons();
  }

  private setFavicon() {
    this.partnerQuery.partner$.pipe(takeUntil(this.destroySubscriber$)).subscribe(partner => {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link['type'] = 'image/x-icon';
      link['rel'] = 'shortcut icon';
      link['href'] = partner.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    });

    this.partnerService
      .getPartnerByDomain({
        domain: 'portal.b3networks.com',
        forceLoad: true
      })
      .subscribe();
  }

  private registerCustomIcons() {
    const icons = [{ name: 'contact', icon: 'assets/icons/launcher_button.svg' }];

    icons.forEach(x => {
      const url = this.domSanitizer.bypassSecurityTrustResourceUrl(x.icon);
      this.matIconRegistry.addSvgIcon(x.name, url);
    });
  }
}
