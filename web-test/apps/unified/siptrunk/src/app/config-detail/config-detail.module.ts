import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { ConfigDetailComponent } from './config-detail.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Route[] = [
  {
    path: '',
    component: ConfigDetailComponent
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
  declarations: [ConfigDetailComponent, ResetPasswordComponent],
  providers: [],
  exports: []
})
export class ConfigDetailModule {
  constructor() {}
}
