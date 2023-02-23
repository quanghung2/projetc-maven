import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare var X: any;

@Component({
  selector: 'contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent {
  type: string;
  subject: string;
  package: string;
  remark: string;
  currentAccount: any = {};
  userInfo: any = {};

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private cacheService: CacheService
  ) {
    this.eventStreamService.on('show-contact-us').subscribe(res => {
      this.type = res.type;
      this.package = res.package;
      if (this.type === 'subscribe') {
        this.subject = 'Subscribe';
      } else if (this.type === 'getMoreNumber') {
        this.subject = 'Get more DID number';
      }
      this.userInfo = this.cacheService.get('user-info');
      this.currentAccount = this.cacheService.get('current-account');
      this.eventStreamService.trigger('open-modal', 'contact-us-modal');
    });
  }

  sendEmailToSale() {
    let message = 'Hi sales, \n';
    message += 'New customer is coming!!!\n';
    message += '------ User info -----------\n';
    message += '- Org: ' + this.userInfo.orgName + '(' + this.userInfo.orgUuid + ')\n';
    message += '- User: ' + this.userInfo.displayName + '\n';
    message += '- User email: ' + this.userInfo.email + '\n';
    message += '- User number: ' + this.userInfo.mobileNumber + '\n';

    message += '------ Plan info -----------\n';
    message += '- Sip account: ' + this.currentAccount.account.username + '\n';
    message += '- Current plan: ' + this.currentAccount.subscription.name + '\n';
    message += '- Request: ' + this.subject + '\n';
    message += '- Remark: ' + this.remark + '\n';

    this.http
      .post('/appsip/contact-us/send-email-to-sales', {
        subject: '[SIP Request] ' + this.subject,
        msg: message
      })
      .subscribe(
        res => {
          this.eventStreamService.trigger('close-modal', 'contact-us-modal');
          X.showSuccess('Email was sent to sale.');
        },
        err => {
          this.eventStreamService.trigger('close-modal', 'contact-us-modal');
          X.showWarn('Cannot email to sale.');
        }
      );
  }
}
