import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { EditDeviceComponent } from './edit-device/edit-device.component';
import { FirewallConfigComponent } from './firewall-config/firewall-config.component';
import { ImportDevicesComponent } from './import-devices/import-devices.component';
import { AssignDeviceComponent } from './ip-phone-detail/assign-device/assign-device.component';
import { IpPhoneDetailComponent } from './ip-phone-detail/ip-phone-detail.component';
import { IpPhoneComponent } from './ip-phone.component';

const routes: Routes = [
  { path: '', component: IpPhoneComponent }
  // { path: '', component: IpPhoneDetailComponent },
  // { path: 'manage-devices', component: IpPhoneComponent }
];

@NgModule({
  declarations: [
    IpPhoneComponent,
    ImportDevicesComponent,
    EditDeviceComponent,
    FirewallConfigComponent,
    IpPhoneDetailComponent,
    AssignDeviceComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiPortalModule,
    FormsModule
  ]
})
export class IpPhoneModule {}
