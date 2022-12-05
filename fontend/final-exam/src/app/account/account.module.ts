import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '../common/material-share/shared-ui-material.module';
import { AccountComponent } from './account.component';
import { AccountStoreComponent } from './account-store/account-store.component';
import { DeleteAccountComponent } from './delete-account/delete-account.component';

const routes: Routes = [{ path: '', component: AccountComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    SharedUiMaterialModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AccountComponent, AccountStoreComponent, DeleteAccountComponent],
  exports: [AccountComponent, AccountStoreComponent, DeleteAccountComponent]
})
export class AccountModule {}
