import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { SharedModule } from '../shared';
import { SettingsDevicesComponent } from './settings-devices/settings-devices.component';
import { SettingsForwardingComponent } from './settings-forwarding/settings-forwarding.component';
import { SettingsInboundComponent } from './settings-inbound/settings-inbound.component';
import { SettingsNavigateComponent } from './settings-navigate/settings-navigate.component';
import { SettingsOutboundComponent } from './settings-outbound/settings-outbound.component';
import { SettingsStatusComponent } from './settings-status/settings-status.component';
import { SettingsSwitchComponent } from './settings-switch/settings-switch.component';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
  { path: '', component: SettingsComponent },
  { path: 'status', component: SettingsStatusComponent },
  { path: 'call-forwarding', component: SettingsForwardingComponent },
  { path: 'devices', component: SettingsDevicesComponent },
  { path: 'inbound-call', component: SettingsInboundComponent },
  { path: 'outbound-call', component: SettingsOutboundComponent }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FlexLayoutModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    CommsSharedModule,
    SharedUiPortalModule,
    SharedCommonModule,
    SharedModule
  ],
  declarations: [
    SettingsComponent,
    SettingsInboundComponent,
    SettingsDevicesComponent,
    SettingsForwardingComponent,
    SettingsStatusComponent,
    SettingsNavigateComponent,
    SettingsSwitchComponent,
    SettingsOutboundComponent
  ]
})
export class SettingsModule {}
