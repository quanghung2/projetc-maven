import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AssignmentPageComponent } from './assignment-page/assignment-page.component';
import { AssignmentPageModule } from './assignment-page/assignment-page.module';
import { LicenseComponent } from './license.component';
import { LicensesComponent } from './licenses/licenses.component';

const routes: Routes = [
  {
    path: '',
    component: LicensesComponent
    // children: [
    //   { path: 'overview', component: LicensesComponent },
    //   { path: 'assignment', component: AssignmentPageComponent },
    //   { path: '', redirectTo: 'overview', pathMatch: 'full' }
    // ]
  },
  { path: ':sku', component: AssignmentPageComponent }
];

@NgModule({
  declarations: [LicenseComponent, LicensesComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AssignmentPageModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedAuthModule
  ]
})
export class LicenseModule {}
