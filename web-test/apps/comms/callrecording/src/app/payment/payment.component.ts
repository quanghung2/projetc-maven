import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { environment } from '../../environments/environment';
import { UserService } from '../shared';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  public orgUuid: string;
  public appId: string = environment.app.id;

  constructor(private userService: UserService, private sanitizer: DomSanitizer) {}

  ngOnInit() {}

  ngAfterViewInit() {
    let user = this.userService.getCurrentUser();
    console.log(user);

    if (user != undefined && user.orgUuid != undefined) {
      this.orgUuid = user.orgUuid;
    }
  }

  getPayment() {
    return this.transform(`https://portal.hoiio.com/paymentV2/#/purchase/${this.orgUuid}/${this.appId}`);
  }

  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
