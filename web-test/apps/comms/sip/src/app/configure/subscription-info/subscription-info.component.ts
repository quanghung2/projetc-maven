import { Component } from '@angular/core';

import { EventStreamService, CacheService } from '../../shared';

declare var X: any;

@Component({
  selector: 'subscription-info',
  templateUrl: './subscription-info.component.html',
  styleUrls: ['./subscription-info.component.scss']
})
export class SubscriptionInfoComponent {
  loading: boolean = true;
  currentAccount: any = {};

  constructor(private eventStreamService: EventStreamService, private cacheService: CacheService) {
    let cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.loadInfo(res);
    });
  }

  loadInfo(curAcc) {
    this.currentAccount = curAcc;
    this.loading = false;
  }

  getMoreDIDNumbers() {
    this.eventStreamService.trigger('show-contact-us', { type: 'getMoreNumber' });
  }

  showSipNumbers() {
    this.eventStreamService.trigger('show-sip-number-list', {});
  }
}
