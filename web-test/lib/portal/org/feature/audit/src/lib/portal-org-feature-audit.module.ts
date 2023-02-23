import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActionBarComponent } from './action-bar/action-bar.component';
import { AppsAuditComponent } from './apps-audit/apps-audit.component';
import { AuditComponent } from './audit/audit.component';
import { AuditModalComponent } from './common/audit-modal/audit-modal.component';
import { BizphoneAuditDetailComponent } from './detail/bizphone/bizphone-audit-detail/bizphone-audit-detail.component';
import { BizphoneAuditModalComponent } from './detail/bizphone/bizphone-audit-modal/bizphone-audit-modal.component';
import { DirectlineDetailComponent } from './detail/directline/directline-detail.component';
import { FaxDetailComponent } from './detail/fax/fax-detail.component';
import { FlowAuditDetailComponent } from './detail/flow-audit-detail/flow-audit-detail.component';
import { MsDataDetailComponent } from './detail/ms-data/ms-data-detail.component';
import { SipDetailComponent } from './detail/sip/sip-detail.component';
import { VirtuallineV1AuditDetailComponent } from './detail/virtualline-v1/virtualline-v1-audit-detail.component';
import { AbsoleteChangeBlocksComponent } from './detail/virtualline-v2/absolete-change-blocks/absolete-change-blocks.component';
import { ApproveVersionComponent } from './detail/virtualline-v2/approve-version/approve-version.component';
import { ChangeBlocksComponent } from './detail/virtualline-v2/change-blocks/change-blocks.component';
import { ChangeNumbersComponent } from './detail/virtualline-v2/change-numbers/change-numbers.component';
import { ChangeSchduleModalComponent } from './detail/virtualline-v2/change-schedule/change-schdule-modal/change-schdule-modal.component';
import { ChangeScheduleComponent } from './detail/virtualline-v2/change-schedule/change-schedule.component';
import { ExportHistoryComponent } from './detail/virtualline-v2/export-history/export-history.component';
import { RollbackVersionComponent } from './detail/virtualline-v2/rollback-version/rollback-version.component';
import { DetailWallboardV1Component } from './detail/wallboard-v1/detail-wallboard-v1.component';
import { EditCallcenterAgentStateComponent } from './detail/wallboard-v2/edit-callcenter-agent-state/edit-callcenter-agent-state.component';
import { EditCallcenterModalComponent } from './detail/wallboard-v2/edit-callcenter-modal/edit-callcenter-modal.component';
import { EditCallcenterQueueComponent } from './detail/wallboard-v2/edit-callcenter-queue/edit-callcenter-queue.component';
import { EditCallcenterSettingComponent } from './detail/wallboard-v2/edit-callcenter-setting/edit-callcenter-setting.component';
import { EditCallcenterComponent } from './detail/wallboard-v2/edit-callcenter/edit-callcenter.component';

const routes: Route[] = [{ path: '', component: AuditComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedAuthModule
  ],
  declarations: [
    AuditComponent,
    ActionBarComponent,
    BizphoneAuditDetailComponent,
    BizphoneAuditModalComponent,
    VirtuallineV1AuditDetailComponent,
    AuditModalComponent,
    ApproveVersionComponent,
    ChangeBlocksComponent,
    ChangeNumbersComponent,
    ChangeScheduleComponent,
    ChangeSchduleModalComponent,
    ExportHistoryComponent,
    RollbackVersionComponent,
    AbsoleteChangeBlocksComponent,
    EditCallcenterQueueComponent,
    EditCallcenterComponent,
    EditCallcenterModalComponent,
    EditCallcenterSettingComponent,
    EditCallcenterAgentStateComponent,
    DetailWallboardV1Component,
    DirectlineDetailComponent,
    SipDetailComponent,
    AppsAuditComponent,
    FaxDetailComponent,
    FlowAuditDetailComponent,
    MsDataDetailComponent
  ]
})
export class PortalOrgFeatureAuditModule {}
