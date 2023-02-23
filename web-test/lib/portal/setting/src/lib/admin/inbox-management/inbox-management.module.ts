import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { HighlightModule } from 'ngx-highlightjs';
import { InboxListComponent } from './inbox-list/inbox-list.component';
import { StoreInboxComponent } from './inbox-list/store-inbox/store-inbox.component';
import { InboxManagementComponent } from './inbox-management.component';
import { RoutingConfigurationComponent } from './routing-configuration/routing-configuration.component';
import { StoreRoutingConfigComponent } from './routing-configuration/store-routing-config/store-routing-config.component';
import { GenerateScriptComponent } from './widget-list/generate-script/generate-script.component';
import { StoreWidgetComponent } from './widget-list/store-widget/store-widget.component';
import { WidgetListComponent } from './widget-list/widget-list.component';

const routes: Routes = [
  {
    path: '',
    component: InboxManagementComponent,
    children: [
      { path: 'inbox', component: InboxListComponent },
      { path: 'inbox/:inboxUuid', component: WidgetListComponent },
      // { path: 'routing-configuration', component: RoutingConfigurationComponent },
      { path: '', redirectTo: 'inbox', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    InboxManagementComponent,
    WidgetListComponent,
    InboxListComponent,
    StoreInboxComponent,
    StoreWidgetComponent,
    GenerateScriptComponent,
    RoutingConfigurationComponent,
    StoreRoutingConfigComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiPortalModule,
    CommsSharedModule,
    SharedAuthModule,
    HighlightModule
  ]
})
export class InboxManagementModule {}
