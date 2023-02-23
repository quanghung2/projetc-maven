import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CreateTeamModalComponent } from './create-team-modal/create-team-modal.component';
import { PermissionComponent } from './permission/permission.component';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { TopupComponent } from './topup/topup.component';
import { RenameMemberComponent } from './rename-member/rename-member.component';
import { Topup2Component } from './topup2/topup2.component';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedCommonModule, SharedUiMaterialModule],
  declarations: [
    TopupComponent,
    PermissionComponent,
    ProfileInfoComponent,
    CreateTeamModalComponent,
    RenameMemberComponent,
    Topup2Component
  ],
  exports: [TopupComponent, PermissionComponent, ProfileInfoComponent, CreateTeamModalComponent]
})
export class PortalSharedModule {}
