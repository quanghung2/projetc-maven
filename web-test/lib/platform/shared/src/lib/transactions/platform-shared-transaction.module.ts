import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { BalanceMovementComponent } from './balance-movement/balance-movement.component';
import { LastOnehundredTransactionsComponent } from './last-onehundred-transactions/last-onehundred-transactions.component';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { TransactionExportComponent } from './transaction-export/transaction-export.component';
import { TransactionsComponent } from './transactions.component';

@NgModule({
  declarations: [
    BalanceMovementComponent,
    LastOnehundredTransactionsComponent,
    TransactionDetailsComponent,
    TransactionExportComponent,
    TransactionsComponent
  ],
  imports: [CommonModule, FormsModule, SharedUiMaterialModule],
  exports: [TransactionsComponent]
})
export class PlatformSharedTransactionModule {}
