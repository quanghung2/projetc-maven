import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PinPromtComponent } from './pin-promt/pin-promt.component';
import { PublicAccessComponent } from './public-access/public-access.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: ':ref', pathMatch: 'full', component: PublicAccessComponent }]),
    SharedUiMaterialModule
  ],
  declarations: [PublicAccessComponent, PinPromtComponent]
})
export class UniversalDashboardFeaturePublicAccessModule {}
