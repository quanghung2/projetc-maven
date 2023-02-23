import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared';
import { EditTagComponent } from './edit-tag/edit-tag.component';
import { OverviewComponent } from './overview.component';

const routes: Route[] = [
  {
    path: '',
    component: OverviewComponent
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
  declarations: [OverviewComponent, EditTagComponent],
  providers: [],
  exports: []
})
export class OverviewModule {
  constructor() {}
}
