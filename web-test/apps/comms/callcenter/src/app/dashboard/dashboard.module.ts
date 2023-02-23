import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AbandonedRateComponent } from './abandoned-rate/abandoned-rate.component';
import { ActionBarComponent } from './action-bar/action-bar.component';
import { AgentStatisticComponent } from './agent-statistic/agent-statistic.component';
import { AgentStatusComponent } from './agent-status/agent-status.component';
import { AverageCallDurationComponent } from './average-call-duration/average-call-duration.component';
import { AverageWaitTimeComponent } from './average-wait-time/average-wait-time.component';
import { CallStatisticComponent } from './call-statistic/call-statistic.component';
import { CurrentCallsInQueueComponent } from './current-calls-in-queue/current-calls-in-queue.component';
import { DashboardComponent } from './dashboard.component';
import { LongestWaitTimeComponent } from './longest-wait-time/longest-wait-time.component';
import { SlaComponent } from './sla/sla.component';

const routes: Route[] = [{ path: '', component: DashboardComponent }];

@NgModule({
  declarations: [
    DashboardComponent,
    AbandonedRateComponent,
    ActionBarComponent,
    AgentStatusComponent,
    AgentStatisticComponent,
    AverageCallDurationComponent,
    AverageWaitTimeComponent,
    CallStatisticComponent,
    CurrentCallsInQueueComponent,
    LongestWaitTimeComponent,
    SlaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiMaterialModule,

    CommsCallcenterSharedModule
  ],
  providers: [],
  bootstrap: []
})
export class DashboardModule {}
