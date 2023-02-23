import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PlatformSharedTransactionModule } from '@b3networks/platform/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { ConvertPaymentComponent } from './convert-payment/convert-payment.component';
import { CreditLimitDialogComponent } from './credit-limit-dialog/credit-limit-dialog.component';
import { DetailsChannelComponent } from './details-channel.component';
import { TransactionDialogComponent } from './transaction-dialog/transaction-dialog.component';

const routes: Routes = [{ path: '', component: DetailsChannelComponent }];

@NgModule({
  declarations: [
    DetailsChannelComponent,
    CreditLimitDialogComponent,
    ConvertPaymentComponent,
    TransactionDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ClipboardModule,
    FormsModule,
    ReactiveFormsModule,
    PlatformSharedTransactionModule
  ]
})
export class DetailsChannelModule {}
