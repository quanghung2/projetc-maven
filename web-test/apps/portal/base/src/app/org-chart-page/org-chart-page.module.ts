import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { OrgChartPageComponent } from './org-chart-page.component';

const routes: Routes = [{ path: '', component: OrgChartPageComponent }];

@NgModule({
  declarations: [OrgChartPageComponent],
  imports: [CommonModule, RouterModule.forChild(routes), FlexLayoutModule, SharedUiMaterialModule, SharedUiPortalModule]
})
export class OrgChartPageModule {}
