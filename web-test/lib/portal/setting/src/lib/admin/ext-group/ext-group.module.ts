import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { ExtGroupComponent } from './ext-group.component';
import { UpdateExtGroupComponent } from './update-ext-group/update-ext-group.component';

const routes: Routes = [{ path: '', component: ExtGroupComponent }];

@NgModule({
  declarations: [ExtGroupComponent, UpdateExtGroupComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    PortalMemberSettingSharedModule,
    SharedUiPortalModule,
    CommsSharedModule
  ]
})
export class ExtGroupModule {}
