import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CommsIvrSharedCoreModule } from '@b3networks/comms/ivr/shared';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CallJourneyComponent } from './call-journey/call-journey.component';
import { ExportHistoryComponent } from './export-history/export-history.component';
import { HistoryComponent } from './history.component';

const routes: Route[] = [{ path: '', component: HistoryComponent }];
@NgModule({
  declarations: [HistoryComponent, ExportHistoryComponent, CallJourneyComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedAuthModule,
    SharedCommonModule,
    CommsIvrSharedCoreModule,
    SharedUiMaterialModule
  ],
  providers: []
})
export class HistoryModule {}
