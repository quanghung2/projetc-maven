import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PermissionManagementComponent } from './permission-management.component';
import { StorePermissionComponent } from './store-permission/store-permission.component';

const routes: Routes = [{ path: '', component: PermissionManagementComponent }];

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule.forChild(routes), SharedUiMaterialModule],
  declarations: [PermissionManagementComponent, StorePermissionComponent]
})
export class PermissionManagementModule {}
