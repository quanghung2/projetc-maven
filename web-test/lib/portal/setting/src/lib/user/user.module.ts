import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { USER_LINK } from '../shared/contants';
import { UpdateExtensionComponent } from './top-bar/update-extension/update-extension.component';
import { UserComponent } from './user.component';

const routes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      {
        path: USER_LINK.workingHours,
        loadChildren: () => import('./working-hours/working-hours.module').then(m => m.WorkingHoursModule)
      },
      {
        path: USER_LINK.devices,
        loadChildren: () => import('./device/device.module').then(m => m.DeviceModule)
      },
      {
        path: USER_LINK.delegate,
        loadChildren: () => import('./delegate/delegate.module').then(m => m.DelegateModule)
      },
      {
        path: USER_LINK.callForwarding,
        loadChildren: () => import('./forwarding/forwarding.module').then(m => m.ForwardingModule)
      },
      {
        path: USER_LINK.inboundCall,
        loadChildren: () => import('./incoming-rules/incoming-rules.module').then(m => m.IncomingRulesModule)
      },
      {
        path: USER_LINK.outboundCall,
        loadChildren: () => import('./outgoing-rules/outgoing-rules.module').then(m => m.OutgoingRulesModule)
      },
      {
        path: USER_LINK.callRecordings,
        loadChildren: () => import('./call-recordings/call-recordings.module').then(m => m.CallRecordingsModule)
      },

      {
        path: USER_LINK.overview,
        loadChildren: () => import('./overview/overview.module').then(m => m.OverviewModule)
      },
      {
        path: USER_LINK.inboundMissedCalls,
        loadChildren: () =>
          import('./inbound-missed-calls/inbound-missed-calls.module').then(m => m.InboundMissedCallsModule)
      },
      {
        path: USER_LINK.inboundCallFilter,
        loadChildren: () =>
          import('./inbound-call-filter/inbound-call-filter.module').then(m => m.InboundCallFilterModule)
      },
      {
        path: USER_LINK.musicOnHold,
        loadChildren: () => import('./custom-moh/custom-moh.module').then(m => m.CustomMohModule)
      },
      { path: '', redirectTo: USER_LINK.overview, pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [UserComponent, UpdateExtensionComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedUiPortalModule
  ]
})
export class PortalMemberSettingSharedUserModule {}
