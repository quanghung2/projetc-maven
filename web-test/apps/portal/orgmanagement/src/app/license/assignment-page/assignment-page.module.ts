import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AddonStatsDetailComponent } from './addon-stats-detail/addon-stats-detail.component';
import { AssignUsersComponent } from './assign-users/assign-users.component';
import { AssignmentPageComponent } from './assignment-page.component';
import { LicenseDetailComponent } from './license-detail/license-detail.component';
import { ManageAddonComponent } from './manage-addon/manage-addon.component';
import { ManageUserComponent } from './manage-user/manage-user.component';
import { MassConfigurationComponent } from './mass-configuration/mass-configuration.component';
import { ProvisionExtComponent } from './provision-ext/provision-ext.component';
import { UpdateExtensionComponent } from './update-extension/update-extension.component';

@NgModule({
  declarations: [
    AssignmentPageComponent,
    ProvisionExtComponent,
    ManageUserComponent,
    ManageAddonComponent,
    MassConfigurationComponent,
    LicenseDetailComponent,
    AssignUsersComponent,
    AddonStatsDetailComponent,
    UpdateExtensionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule
  ],
  exports: [AssignmentPageComponent]
})
export class AssignmentPageModule {}
