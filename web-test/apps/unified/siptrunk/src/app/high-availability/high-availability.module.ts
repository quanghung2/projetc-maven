import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { HighAvailabilityComponent } from './high-availability.component';

const routes: Route[] = [
  {
    path: '',
    component: HighAvailabilityComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedModule
  ],
  declarations: [HighAvailabilityComponent],
  providers: []
})
export class HighAvailabilityModule {}
