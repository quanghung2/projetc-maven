import { AppCommonModule } from './../common/common.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecurityComponent } from './security.component';

const routes: Routes = [{ path: '', component: SecurityComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), AppCommonModule],
  exports: [RouterModule]
})
export class SecurityRoutingModule {}
