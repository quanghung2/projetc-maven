import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CreatePlanDialogComponent } from './create-plan-dialog/create-plan-dialog.component';
import { PlanComponent } from './plan.component';

const routes: Route[] = [{ path: '', component: PlanComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    FlexLayoutModule,
    SharedUiMaterialModule
  ],
  declarations: [PlanComponent, CreatePlanDialogComponent]
})
export class PlanModule {}
