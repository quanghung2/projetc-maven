import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CallbackRequestsComponent } from './callback-requests.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';

const routes: Routes = [{ path: '', component: CallbackRequestsComponent }];

@NgModule({
  declarations: [CallbackRequestsComponent],
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
export class CallbackRequestsModule {}
