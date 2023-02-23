import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { DetailAccountComponent } from './detail-account/detail-account.component';
import { EditIpSipComponent } from './edit-ip-sip/edit-ip-sip.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SipAccountComponent } from './sip-account.component';

const routes: Route[] = [
  {
    path: '',
    component: SipAccountComponent
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
    SharedUiMaterialNativeDateModule,
    SharedModule
  ],
  declarations: [SipAccountComponent, ResetPasswordComponent, DetailAccountComponent, EditIpSipComponent],
  entryComponents: [],
  providers: [],
  exports: []
})
export class SipAccountModule {
  constructor() {}
}
