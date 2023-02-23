import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SellerWallet } from '@b3networks/api/billing';

@Component({
  selector: 'psh-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  @Input() totalPrice = 0;
  @Input() wallet: SellerWallet;
  @Input() autoRenew: boolean;
  @Input() totalActivationFee: number;
  @Input() hasNumber: boolean;
  @Output() autoRenewChange: EventEmitter<boolean> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {
    this.autoRenewChange.emit(this.autoRenew);
  }

  changeRenew() {
    this.autoRenewChange.emit(this.autoRenew);
  }
}
