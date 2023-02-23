import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { PlatformSharedTransactionModule } from '@b3networks/platform/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { TransactionComponent } from './transaction/transaction.component';

const routes: Route[] = [{ path: '', component: TransactionComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    PlatformSharedTransactionModule
  ],
  declarations: [TransactionComponent]
})
export class PortalOrgFeatureTransactionModule {}
