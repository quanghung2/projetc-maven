import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { CompanyComponent } from './company.component';
import { StoreContactComponent } from './store-contact/store-contact.component';

const routes: Route[] = [
  {
    path: '',
    component: CompanyComponent
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
    SharedAuthModule,
    SharedModule
  ],
  declarations: [CompanyComponent, StoreContactComponent],
  entryComponents: [],
  providers: [],
  exports: []
})
export class CompanyModule {
  constructor() {}
}
