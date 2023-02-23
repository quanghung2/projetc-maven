import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { AddPersonalWhitelistComponent } from './add-personal-whitelist/add-personal-whitelist.component';
import { PersonalComponent } from './personal.component';

const routes: Route[] = [
  {
    path: '',
    component: PersonalComponent
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
  declarations: [PersonalComponent, AddPersonalWhitelistComponent],
  entryComponents: [],
  providers: [],
  exports: []
})
export class PersonalModule {
  constructor() {}
}
