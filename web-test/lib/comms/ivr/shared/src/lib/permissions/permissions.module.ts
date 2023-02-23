import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PermissionsComponent } from './permissions.component';
import { PermissionsDetailComponent } from './permissions-detail/permissions-detail.component';
import { PermissionsAssignComponent } from './permissions-assign/permissions-assign.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [{ path: '', component: PermissionsComponent }];

@NgModule({
  declarations: [PermissionsComponent, PermissionsDetailComponent, PermissionsAssignComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedCommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule
  ]
})
export class PermissionModule {}
