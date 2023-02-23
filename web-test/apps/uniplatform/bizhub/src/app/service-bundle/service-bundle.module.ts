import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ServiceBundleComponent } from './service-bundle.component';
import { StoreBundleComponent } from './store-bundle/store-bundle.component';

const routes: Routes = [{ path: '', component: ServiceBundleComponent }];

@NgModule({
  declarations: [ServiceBundleComponent, StoreBundleComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedCommonModule, SharedUiMaterialModule]
})
export class ServiceBundleModule {}
