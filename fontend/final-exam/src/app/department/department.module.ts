import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '../common/material-share/shared-ui-material.module';
import { AddAccountComponent } from './add-account/add-account.component';
import { DeleteDepartmentComponent } from './delete-department/delete-department.component';
import { DepartmentStoreComponent } from './department-store/department-store.component';
import { DepartmentComponent } from './department.component';

const routes: Routes = [{ path: '', component: DepartmentComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    SharedUiMaterialModule,
    RouterModule.forChild(routes),
  ],
  declarations: [DepartmentComponent, DepartmentStoreComponent, DeleteDepartmentComponent, AddAccountComponent],
  exports: [DepartmentComponent, DepartmentStoreComponent, DeleteDepartmentComponent, AddAccountComponent]
})
export class DepartmentModule {}
