import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'psh-payment-fail',
  templateUrl: './payment-fail.component.html',
  styleUrls: ['./payment-fail.component.scss']
})
export class PaymentFailComponent {
  @Input() msg: string;
  @Input() goBackUrl: string;
  constructor(private router: Router) {}

  goBack() {
    if (this.goBackUrl) {
      document.location.href = this.goBackUrl;
    } else {
      this.router.navigate(['']);
    }
  }
}
