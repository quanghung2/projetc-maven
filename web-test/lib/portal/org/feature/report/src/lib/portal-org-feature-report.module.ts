import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ReportComponent } from './report.component';

const routes: Routes = [{ path: '', component: ReportComponent }];
@NgModule({
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), SharedCommonModule, SharedUiMaterialModule],
  declarations: [ReportComponent],
  providers: []
})
export class PortalOrgFeatureReportModule {}
