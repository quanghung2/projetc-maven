import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { WorkingHoursComponent } from './working-hours.component';

const routes: Routes = [{ path: '', component: WorkingHoursComponent }];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FlexLayoutModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    CommsSharedModule,
    SharedUiPortalModule
  ],
  declarations: [WorkingHoursComponent]
})
export class WorkingHoursModule {}
