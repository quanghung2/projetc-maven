import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileOrg } from '@b3networks/api/auth';
import { AutoTopupSetting, PaymentService, UpdateAutoTopupRequest } from '@b3networks/api/payment';

@Component({
  selector: 'pop-auto-topup-config',
  templateUrl: './auto-topup-config.component.html',
  styleUrls: ['./auto-topup-config.component.scss']
})
export class AutoTopupConfigComponent implements OnInit, OnChanges {
  @Input() settings: AutoTopupSetting;
  @Input() organization: ProfileOrg;
  @Input() isBlockAutoTopUpSub: boolean;

  autoTopup: boolean;
  autoTopupRenew: boolean;
  isNewUser: boolean;
  paymentMethodToTopup: string;

  get isOfflineGateway() {
    let offline;
    if (this.settings) {
      offline = this.settings.gatewayCode === 'salesorder';
    }
    return offline;
  }

  constructor(private paymentService: PaymentService, private snackBar: MatSnackBar) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.settings) {
      this.setPaymentSettingReponse();
    }
  }

  ngOnInit(): void {}

  setPaymentSettingReponse() {
    this.paymentMethodToTopup = '';
    if (this.settings.gatewayCode) {
      this.isNewUser = false;
      if (this.settings.gatewayCode === 'salesorder') {
        this.paymentMethodToTopup = 'Sales Order';
      } else {
        this.paymentMethodToTopup = 'Credit Card';
      }
    } else {
      this.isNewUser = true;
    }
  }

  onChangeTopUp(event: MatSlideToggleChange) {
    this.settings.enable = event.checked;
    if (event.checked) {
      this.settings.renewalSubscription = event.checked;
    }

    const payload: UpdateAutoTopupRequest = {
      enable: event.checked,
      renewalSubscription: event.checked ? true : this.settings.renewalSubscription
    };

    this.paymentService.setAutoTopup(payload).subscribe(
      settings => {
        this.settings = settings;
        this.openSnakBar(`You have turned ${settings.enable ? 'on' : 'off'} Auto Top-up Credits.`, true);
        return;
      },
      error => {
        this.settings.enable = !payload.enable;
        this.settings.renewalSubscription = !payload.renewalSubscription;
        const code = error.code;
        if (code && code.indexOf('payment.noStoredGateway') > -1) {
          this.openSnakBar('No card has been stored yet.', false);
        }
      }
    );
  }

  private openSnakBar(message: string, success: boolean) {
    this.snackBar.open(message, '', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'end',
      panelClass: [success ? 'top-up-snack-bar-success' : 'top-up-snack-bar-error']
    });
  }
}
