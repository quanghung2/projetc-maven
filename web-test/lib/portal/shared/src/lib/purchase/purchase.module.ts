import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PortalSharedModule } from '../portal-shared.module';
import { PaymentFailComponent } from './payment-fail/payment-fail.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentComponent } from './payment/payment.component';
import { PurchaseProductComponent } from './purchase-product/purchase-product.component';
import { PurchaseComponent } from './purchase.component';
import { SelectAddonComponent } from './select-addon/select-addon.component';
import { SelectNumberProductComponent } from './select-number-product/select-number-product.component';
import { SelectNumberComponent } from './select-number/select-number.component';
import { StepFailComponent } from './step-fail/step-fail.component';

const routes: Routes = [
  { path: '', component: PurchaseComponent },
  { path: 'success', component: PaymentSuccessComponent },
  { path: 'fail', component: PaymentFailComponent },
  { path: 'step-fail', component: StepFailComponent }
];

@NgModule({
  declarations: [
    PurchaseComponent,
    SelectNumberComponent,
    PaymentComponent,
    PaymentSuccessComponent,
    PaymentFailComponent,
    SelectAddonComponent,
    PurchaseProductComponent,
    SelectNumberProductComponent,
    StepFailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    FormsModule,
    PortalSharedModule
  ]
})
export class PortalSharedPurchaseModule {}
