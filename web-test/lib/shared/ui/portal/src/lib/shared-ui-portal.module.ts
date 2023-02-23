import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { InfoMemberComponent } from './org-chart/info-member/info-member.component';
import { OrgChartDialogComponent } from './org-chart/org-chart-dialog/org-chart-dialog.component';
import { OrgChartComponent } from './org-chart/org-chart.component';
import { TemplatePortalComponent } from './template-portal/template-portal.component';

@NgModule({
  imports: [CommonModule, PortalModule, SharedUiMaterialModule],
  declarations: [TemplatePortalComponent, OrgChartComponent, InfoMemberComponent, OrgChartDialogComponent],
  exports: [TemplatePortalComponent, OrgChartComponent, InfoMemberComponent, OrgChartDialogComponent]
})
export class SharedUiPortalModule {}
