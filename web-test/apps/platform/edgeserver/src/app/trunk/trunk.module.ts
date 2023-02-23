import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CreateTrunkModalComponent } from '../trunk/create-trunk-modal/create-trunk-modal.component';
import { TrunkComponent } from '../trunk/trunk.component';

const routes: Route[] = [
  {
    path: '',
    component: TrunkComponent
  }
];

@NgModule({
  declarations: [TrunkComponent, CreateTrunkModalComponent],
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
export class TrunkModule {}
