import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionComponent } from './permission.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PermissionDetailComponent } from './permission-detail/permission-detail.component';
import { AddPermissionDialogComponent } from './add-permission-dialog/add-permission-dialog.component';

const routes: Routes = [{ path: '', component: PermissionComponent }];
@NgModule({
  declarations: [PermissionComponent, PermissionDetailComponent, AddPermissionDialogComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedCommonModule, SharedUiMaterialModule]
})
export class PermissionModule {}
