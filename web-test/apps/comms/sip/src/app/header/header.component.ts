import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EventStreamService } from '../shared';

declare var X: any;

@Component({
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})
export class HeaderComponent {
  state = 'configure';
  accountList: any = [];
  currentAccount: any = {};

  searchString: string;

  constructor(private eventStreamService: EventStreamService, private router: Router) {
    this.eventStreamService.on('accounts-loaded').subscribe(res => {
      this.accountList = res;
    });
    this.eventStreamService.on('switch-account').subscribe(res => {
      this.currentAccount = res;
    });
  }

  switchAccount(account) {
    this.eventStreamService.trigger('switch-account', account);
  }

  viewSipAccountList() {
    this.eventStreamService.trigger('show-sip-account-list', {});
  }

  subscribeMore() {
    this.router.navigate(['landing'], { queryParamsHandling: 'merge' });
  }

  showConfigure() {
    if (this.accountList.length > 0) {
      this.state = 'configure';
      this.router.navigate(['/configure'], { queryParamsHandling: 'merge' });
      this.eventStreamService.trigger('switch-account', this.accountList[0]);
      this.eventStreamService.trigger('switched-account', this.currentAccount);
    } else {
      this.router.navigate(['landing'], { queryParamsHandling: 'merge' });
    }
  }

  showCallerIdRemark() {
    if (this.accountList.length > 0) {
      this.state = 'callerid-remark';
      this.router.navigate(['/callerid-remark'], { queryParamsHandling: 'merge' });
    } else {
      this.router.navigate(['landing'], { queryParamsHandling: 'merge' });
    }
  }

  enableCalleridRemark() {
    const supportedOrg = ['c369128e-595d-4198-84cd-739e1327c3a0'];
    const supportedDomain = ['localhost', 'portal.hoiio.net'];
    return (
      supportedOrg.indexOf(X.getContext()['orgUuid']) >= 0 || supportedDomain.indexOf(window.location.hostname) >= 0
    );
  }
}
