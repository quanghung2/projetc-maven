import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CreateNetcapModalComponent } from './create-netcap-modal/create-netcap-modal.component';
import { NetcapComponent } from './netcap.component';

const routes: Route[] = [
  {
    path: '',
    component: NetcapComponent
  }
];

@NgModule({
  declarations: [NetcapComponent, CreateNetcapModalComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    SharedUiConfirmDialogModule,
    SharedCommonModule
  ]
})
export class NetcapModule {}
