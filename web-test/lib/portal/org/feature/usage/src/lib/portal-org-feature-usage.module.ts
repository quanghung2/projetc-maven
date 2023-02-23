import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { GeneralReportComponent } from './usage-history/general-report/general-report.component';
import { PaymentTransactionComponent } from './usage-history/payment-transaction/payment-transaction.component';
import { UsageHistoryComponent } from './usage-history/usage-history.component';

const routes: Routes = [
  {
    path: '',
    component: UsageHistoryComponent
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule, SharedUiMaterialModule],
  declarations: [UsageHistoryComponent, GeneralReportComponent, PaymentTransactionComponent]
})
export class PortalOrgFeatureUsageModule {}
