import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { PortalSharedModule } from '@b3networks/portal/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AutoTopupConfigComponent } from './payment/auto-topup-config/auto-topup-config.component';
import { BalanceInfoComponent } from './payment/balance-info/balance-info.component';
import { CreditLimitModalComponent } from './payment/balance-info/credit-limit-modal/credit-limit-modal.component';
import { TranferCreditComponent } from './payment/balance-info/tranfer-credit/tranfer-credit.component';
import { PaymentComponent } from './payment/payment.component';
import { DeleteStoredGatewayComponent } from './payment/stored-card/delete-stored-gateway/delete-stored-gateway.component';
import { StoredCardComponent } from './payment/stored-card/stored-card.component';
import { TopupFailureComponent } from './payment/topup-failure/topup-failure.component';

const routes: Route[] = [{ path: '', component: PaymentComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,

    SharedUiMaterialModule,
    PortalSharedModule
  ],
  declarations: [
    PaymentComponent,
    BalanceInfoComponent,
    AutoTopupConfigComponent,
    StoredCardComponent,
    DeleteStoredGatewayComponent,
    TranferCreditComponent,
    TopupFailureComponent,
    CreditLimitModalComponent
  ]
})
export class PortalOrgFeaturePaymentModule {}
