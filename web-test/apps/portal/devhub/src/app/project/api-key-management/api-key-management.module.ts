import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ApiKeyManagementComponent } from './api-key-management.component';
import { StoreApiKeyComponent } from './store-api-key/store-api-key.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';

const routes: Routes = [{ path: '', component: ApiKeyManagementComponent }];

@NgModule({
  declarations: [ApiKeyManagementComponent, StoreApiKeyComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ClipboardModule,
    SharedUiMaterialModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    SharedAuthModule,
    SharedCommonModule
  ]
})
export class ApiKeyManagementModule {}
