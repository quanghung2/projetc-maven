import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PortalSharedModule } from '@b3networks/portal/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ManageLicenseModule } from './manage-license/manage-license.module';
import { ManageRightModule } from './manage-right/manage-right.module';
import { MemberAccountInfoModule } from './member-account-info/member-account-info.module';
import { MemberDetailComponent } from './member-detail.component';

@NgModule({
  declarations: [MemberDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MemberAccountInfoModule,
    ManageLicenseModule,
    ManageRightModule,

    SharedCommonModule,
    SharedUiMaterialModule,

    PortalSharedModule
  ],
  exports: [MemberDetailComponent]
})
export class MemberDetailModule {}
