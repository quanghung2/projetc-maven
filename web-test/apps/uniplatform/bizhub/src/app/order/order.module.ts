import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ApproveOrderComponent } from './approve-order/approve-order.component';
import { OrderComponent } from './order.component';
import { SelectNumberComponent } from './select-number/select-number.component';
import { StoreOrderComponent } from './store-order/store-order.component';
import { LoadNumberComponent } from './load-number/load-number.component';

const routes: Routes = [{ path: '', component: OrderComponent }];

@NgModule({
  declarations: [OrderComponent, StoreOrderComponent, SelectNumberComponent, ApproveOrderComponent, LoadNumberComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule
  ]
})
export class OrderModule {}
