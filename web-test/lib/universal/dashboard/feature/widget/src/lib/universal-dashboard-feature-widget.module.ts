import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { AbandonedRateWidgetComponent } from './abandoned-rate-widget/abandoned-rate-widget.component';
import { AgentListComponent } from './agent-list/agent-list.component';
import { AgentStatisticComponent } from './agent-statistic/agent-statistic.component';
import { AgentsStatusComponent } from './agents-status/agents-status.component';
import { AvgWidgetComponent } from './avg-widget/avg-widget.component';
import { CallCenterLineWidgetComponent } from './call-center-widget/call-center-line-widget/call-center-line-widget.component';
import { CallCenterNoDataComponent } from './call-center-widget/call-center-no-data/call-center-no-data.component';
import { CallCenterPieWidgetComponent } from './call-center-widget/call-center-pie-widget/call-center-pie-widget.component';
import { CallCenterTableWidgetComponent } from './call-center-widget/call-center-table-widget/call-center-table-widget.component';
import { CallQueueSummaryWidgetComponent } from './call-queue-summary-widget/call-queue-summary-widget.component';
import { CallStatisticComponent } from './call-statistic/call-statistic.component';
import { CurrentAgentOverviewWidgetComponent } from './current-agent-overview-widget/current-agent-overview-widget.component';
import { GojekApiPercentageComponent } from './gojek-api-percentage/gojek-api-percentage.component';
import { IvrActiveCallsWidgetComponent } from './ivr-active-calls-widget/ivr-active-calls-widget.component';
import { ManualOugoingDataWidgetComponent } from './manual-ougoing-data-widget/manual-ougoing-data-widget.component';
import { ManualOugoingStatWidgetComponent } from './manual-ougoing-stat-widget/manual-ougoing-stat-widget.component';
import { NecAgentPerformanceWidgetComponent } from './nec-agent-performance-widget/nec-agent-performance-widget.component';
import { SlaWidgetComponent } from './sla-widget/sla-widget.component';
import { UserStateWidgetComponent } from './user-state-widget/user-state-widget.component';
import { WidgetComponent } from './widget/widget.component';

@NgModule({
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedAuthModule,
    FlexLayoutModule,
    MatListModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatTooltipModule
  ],
  declarations: [
    WidgetComponent,
    SlaWidgetComponent,
    AbandonedRateWidgetComponent,
    AvgWidgetComponent,
    AgentStatisticComponent,
    AgentsStatusComponent,
    CallStatisticComponent,
    ManualOugoingStatWidgetComponent,
    ManualOugoingDataWidgetComponent,
    AgentListComponent,
    GojekApiPercentageComponent,
    IvrActiveCallsWidgetComponent,
    CurrentAgentOverviewWidgetComponent,
    NecAgentPerformanceWidgetComponent,
    CallQueueSummaryWidgetComponent,
    CallCenterPieWidgetComponent,
    CallCenterTableWidgetComponent,
    CallCenterLineWidgetComponent,
    CallCenterNoDataComponent,
    UserStateWidgetComponent
  ],
  exports: [
    WidgetComponent,
    SlaWidgetComponent,
    AbandonedRateWidgetComponent,
    AvgWidgetComponent,
    AgentStatisticComponent,
    AgentsStatusComponent,
    CallStatisticComponent,
    ManualOugoingStatWidgetComponent,
    ManualOugoingDataWidgetComponent,
    AgentListComponent,
    GojekApiPercentageComponent,
    IvrActiveCallsWidgetComponent,
    CurrentAgentOverviewWidgetComponent,
    NecAgentPerformanceWidgetComponent,
    CallQueueSummaryWidgetComponent,
    CallCenterPieWidgetComponent,
    CallCenterTableWidgetComponent,
    CallCenterLineWidgetComponent,
    CallCenterNoDataComponent,
    UserStateWidgetComponent
  ]
})
export class UniversalDashboardFeatureWidgetModule {}
