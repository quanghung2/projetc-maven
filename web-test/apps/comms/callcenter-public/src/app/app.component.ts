import { Component, OnInit } from '@angular/core';
import { PartnerQuery, PartnerService } from '@b3networks/api/partner';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  constructor(private partnerService: PartnerService, private partnerQuery: PartnerQuery) {
    super();
  }

  ngOnInit(): void {
    this.initNonSessionData();
  }

  private initNonSessionData() {
    this.partnerQuery.partner$.pipe(takeUntil(this.destroySubscriber$)).subscribe(partner => {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link['type'] = 'image/x-icon';
      link['rel'] = 'shortcut icon';
      link['href'] = partner.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    });

    this.partnerService.getPartnerByDomain().subscribe();
  }
}
