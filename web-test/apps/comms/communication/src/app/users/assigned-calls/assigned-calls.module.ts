import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AssignedCallsComponent } from './assigned-calls.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActionBarComponent } from './action-bar/action-bar.component';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';

const routes: Routes = [{ path: '', component: AssignedCallsComponent }];

@NgModule({
  declarations: [ActionBarComponent, AssignedCallsComponent],
  exports: [ActionBarComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule
  ]
})
export class AssignedCallsModule {}
