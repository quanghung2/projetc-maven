import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { BusyLampFieldComponent } from './busy-lamp-field.component';
import { CreateExtBLFDialogComponent } from './create-ext-blf-dialog/create-ext-blf-dialog.component';
import { UpdateExtBLFDialogComponent } from './update-ext-blf-dialog/update-ext-blf-dialog.component';

const routes: Routes = [{ path: '', component: BusyLampFieldComponent }];

@NgModule({
  declarations: [BusyLampFieldComponent, CreateExtBLFDialogComponent, UpdateExtBLFDialogComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    PortalMemberSettingSharedModule,
    SharedUiPortalModule
  ]
})
export class BusyLampFieldModule {}
