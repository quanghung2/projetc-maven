import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { MAT_NATIVE_DATE_FORMATS } from '@matheo/datepicker/core';
import { ADMIN_LINK } from '../../shared/contants';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { CallParkingConfigComponent } from './call-parking-config/call-parking-config.component';
import { PhonsystemGeneralComponent as PhonesystemGeneralComponent } from './phonesystem-general/phonesystem-general.component';
import { SystemSettingsComponent } from './system-settings.component';
import { UpdateAgentConfigurationComponent } from './update-agent-configuration/update-agent-configuration.component';
import { UpdateCustomHolidayComponent } from './update-custom-holiday/update-custom-holiday.component';
import { UpdatePickupPrefixComponent } from './update-pickup-prefix/update-pickup-prefix.component';
import { UpdatePublicHolidayComponent } from './update-public-holiday/update-public-holiday.component';

export const routes: Routes = [
  { path: '', component: SystemSettingsComponent },
  { path: ADMIN_LINK.generalPhoneSystem, component: PhonesystemGeneralComponent }
];

@NgModule({
  declarations: [
    SystemSettingsComponent,
    UpdatePickupPrefixComponent,
    CallParkingConfigComponent,
    UpdatePublicHolidayComponent,
    UpdateCustomHolidayComponent,
    PhonesystemGeneralComponent,
    UpdateAgentConfigurationComponent
  ],
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedUiMaterialModule,
    PortalMemberSettingSharedModule,
    CommsSharedModule
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }]
})
export class SystemSettingsModule {}
