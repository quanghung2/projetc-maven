import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'psh-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent {
  @Input() productName: string;
  @Input() user: any;
  @Input() goBackUrl: string;
  constructor(private router: Router) {}

  gotoApp() {
    if (this.goBackUrl) {
      document.location.href = this.goBackUrl;
    } else {
      this.router.navigate(['']);
    }
  }
}
