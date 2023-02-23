import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClidModalComponent } from './clid-modal/clid-modal.component';
import { DnisModalComponent } from './dnis-modal/dnis-modal.component';
import { ProprietaryModalComponent } from './proprietary-modal/proprietary-modal.component';
import { ProprietaryComponent } from './proprietary/proprietary.component';
import { RoutingComponent } from './routing.component';

const routes: Route[] = [
  {
    path: '',
    component: RoutingComponent
  }
];

@NgModule({
  declarations: [
    RoutingComponent,
    DnisModalComponent,
    ClidModalComponent,
    ProprietaryComponent,
    ProprietaryModalComponent
  ],
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
export class RoutingModule {}
