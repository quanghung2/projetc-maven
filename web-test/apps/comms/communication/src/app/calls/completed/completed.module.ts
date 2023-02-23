import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompletedComponent } from '../completed/completed.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { ActionBarComponent } from './action-bar/action-bar.component';

const routes: Routes = [{ path: '', component: CompletedComponent }];

@NgModule({
  declarations: [CompletedComponent, ActionBarComponent],
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
export class CompletedModule {}
