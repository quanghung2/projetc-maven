import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare var X: any;

@Component({
  selector: 'sip-number-list',
  templateUrl: './sip-number-list.component.html',
  styleUrls: ['./sip-number-list.component.scss']
})
export class SipNumberListComponent {
  loading = true;
  sipNumbers: any = [];

  constructor(private eventStreamService: EventStreamService, private cacheService: CacheService) {
    this.eventStreamService.on('show-sip-number-list').subscribe(res => {
      this.eventStreamService.trigger('open-modal', 'sip-number-list-modal');
      const currentAccount = this.cacheService.get('current-account');
      this.sipNumbers = currentAccount.account.numbers;
      this.loading = false;
    });
  }
}
