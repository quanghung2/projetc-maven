import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { BillingComponent } from './billing/billing.component';
import { MyInfoComponent } from './my-info/my-info.component';
import { OrgTimeFormatSettingsComponent } from './org-time-format-settings/org-time-format-settings.component';
import { UpdateOrgNameDialogComponent } from './update-org-name-dialog/update-org-name-dialog.component';

export enum PORTAL_SETTING_ROUTE_LINK {
  address = 'address',
  myinfo = 'myinfo',
  callHistory = 'call-history'
}

const routes: Route[] = [
  { path: PORTAL_SETTING_ROUTE_LINK.address, component: BillingComponent },
  { path: PORTAL_SETTING_ROUTE_LINK.myinfo, component: MyInfoComponent },
  { path: '', redirectTo: PORTAL_SETTING_ROUTE_LINK.address, pathMatch: 'full' }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedCommonModule,
    SharedAuthModule
  ],
  declarations: [BillingComponent, MyInfoComponent, UpdateOrgNameDialogComponent, OrgTimeFormatSettingsComponent]
})
export class PortalOrgFeatureSettingsModule {}
