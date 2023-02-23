import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { AdminToolsCallerIdComponent } from './admin-tools-caller-id/admin-tools-caller-id.component';
import { AdminToolsDevicesComponent } from './admin-tools-devices/admin-tools-devices.component';
import { DevicesDialogComponent } from './admin-tools-devices/devices-dialog/devices-dialog.component';
import { ResetPasswordComponent } from './admin-tools-devices/devices-dialog/reset-password/reset-password.component';
import { AdminToolsForwardingComponent } from './admin-tools-forwarding/admin-tools-forwarding.component';
import { AdminToolsMembersComponent } from './admin-tools-members/admin-tools-members.component';
import { AdminToolsPublicHolidayComponent } from './admin-tools-public-holiday/admin-tools-public-holiday.component';
import { AdminToolsRulesComponent } from './admin-tools-rules/admin-tools-rules.component';
import { AdminToolsTransferComponent } from './admin-tools-transfer/admin-tools-transfer.component';
import { AdminToolsComponent } from './admin-tools.component';
import { ConfigPermissionComponent } from './config-permission/config-permission.component';
import { ImportCsvComponent } from './import-csv/import-csv.component';

export const routes: Routes = [{ path: '', component: AdminToolsComponent }];

@NgModule({
  declarations: [
    AdminToolsComponent,
    AdminToolsMembersComponent,
    AdminToolsForwardingComponent,
    AdminToolsTransferComponent,
    AdminToolsDevicesComponent,
    AdminToolsRulesComponent,
    AdminToolsCallerIdComponent,
    AdminToolsPublicHolidayComponent,
    ImportCsvComponent,
    DevicesDialogComponent,
    ConfigPermissionComponent,
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedUiMaterialModule,
    PortalMemberSettingSharedModule
  ]
})
export class AdminToolsModule {}
