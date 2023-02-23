import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { PortalOrgSharedHistoryModule } from '@b3networks/portal/org/feature/history';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { HistoriesHeaderComponent } from './histories-header/histories-header.component';
import { HistoriesComponent } from './histories.component';

const routes: Route[] = [
  {
    path: '',
    component: HistoriesComponent
  }
];
@NgModule({
  declarations: [HistoriesComponent, HistoriesHeaderComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedCommonModule,

    SharedUiMaterialModule,

    CommsSharedModule,
    PortalOrgSharedHistoryModule,
    FlexLayoutModule,
    ChatSharedCoreModule
  ]
})
export class ChatSharedHistoriesModule {}
