import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { DeviceComponent } from './device.component';
import { RingmeFormModule } from '../ringme-form/ringme-form.module';
import { RegisteredMobileDevicesComponent } from './registered-mobile-devices/registered-mobile-devices.component';
import { SharedAuthModule } from '@b3networks/shared/auth';

const routes: Routes = [{ path: '', component: DeviceComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    SharedCommonModule,
    CommsSharedModule,
    SharedUiPortalModule,
    RingmeFormModule,
    SharedAuthModule
  ],
  declarations: [DeviceComponent, RegisteredMobileDevicesComponent]
})
export class DeviceModule {}
