import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ApiKeyManagementComponent } from './api-key-management.component';

const routes: Routes = [{ path: '', component: ApiKeyManagementComponent }];

@NgModule({
  declarations: [ApiKeyManagementComponent],
  imports: [CommonModule, RouterModule.forChild(routes), ClipboardModule, SharedUiMaterialModule]
})
export class ApiKeyManagementModule {}
