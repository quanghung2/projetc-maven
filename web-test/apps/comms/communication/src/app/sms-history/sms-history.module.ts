import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { SmsHistoryHomeComponent } from './sms-history.component';

const routes: Routes = [
  {
    path: '',
    component: SmsHistoryHomeComponent
  }
];

@NgModule({
  declarations: [SmsHistoryHomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,

    SharedUiMaterialModule,
    SharedModule,

    SharedAuthModule,
    SharedCommonModule
  ]
})
export class SmsHistoryModule {}
