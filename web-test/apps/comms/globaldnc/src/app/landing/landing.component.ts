import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare let _: any;
declare let X: any;

@Component({
  selector: 'landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  loading = true;
  userInfo: any = {};
  subscribeUrl: string;

  constructor(private eventStreamService: EventStreamService, private cacheService: CacheService) {
    const cur = this.cacheService.get('user-info');
    if (cur) {
      this.userInfo = cur;
      this.loading = false;
    }

    this.eventStreamService.on('accounts-loaded').subscribe(res => {
      this.userInfo = this.cacheService.get('user-info');
      this.loading = false;
    });
  }

  getSubscribeUrl() {
    return ''; // this.sanitizer.bypassSecurityTrustResourceUrl('https://portal.hoiio.com/paymentV2/#/purchase/' + this.userInfo.orgUuid + '/' + this.userInfo.appId);
  }
}
