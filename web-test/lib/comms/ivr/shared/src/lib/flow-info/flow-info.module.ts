import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiDragScrollModule } from '@b3networks/shared/ui/drag-scroll';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { MAT_NATIVE_DATE_FORMATS } from '@matheo/datepicker/core';
import { CommsIvrSharedCoreModule } from '../core/core.model';
import { BlockDetailsComponent } from './block-details/block-details.component';
import { CommonComponent } from './blocks/common/common.component';
import { ConditionBranchComponent } from './blocks/condition/condition-branch/condition-branch.component';
import { ConditionComponent } from './blocks/condition/condition.component';
import { ConfirmComponent } from './blocks/confirm/confirm.component';
import { GatherBranchComponent } from './blocks/gather/gather-branch/gather-branch.component';
import { GatherComponent } from './blocks/gather/gather.component';
import { GenieComponent } from './blocks/genie/genie.component';
import { GoComponent } from './blocks/go/go.component';
import { MonitorComponent } from './blocks/monitor/monitor.component';
import { NotificationComponent } from './blocks/notification/notification.component';
import { PlayComponent } from './blocks/play/play.component';
import { TestCallComponent } from './blocks/test-call/test-call.component';
import { MissTransferComponent } from './blocks/transfer/miss-transfer/miss-transfer.component';
import { TransferComponent } from './blocks/transfer/transfer.component';
import { TtsComponent } from './blocks/tts/tts.component';
import { WebhookBranchComponent } from './blocks/webhook/webhook-branch/webhook-branch.component';
import { WebhookComponent } from './blocks/webhook/webhook.component';
import { MultipleBlocksDialogComponent } from './create-block/multiple/multiple.component';
import { SingleBlockDialogComponent } from './create-block/single/single.component';
import { DeleteBlockComponent } from './delete-block/delete-block.component';
import { FlowInfoComponent } from './flow-info.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { NextDialogComponent } from './select-block/next/next.component';
import { PreviousComponent } from './select-block/previous/previous.component';
import { TestCallBeforeDeployToProductionComponent } from './test-call-before-deploy-to-production/test-call-before-deploy-to-production.component';
import { AddGroupComponent } from './worktime/worktime-custom/add-group/add-group.component';
import { WorktimeCustomComponent } from './worktime/worktime-custom/worktime-custom.component';
import { WorktimeComponent } from './worktime/worktime.component';

const routes: Routes = [{ path: '', component: FlowInfoComponent }];

@NgModule({
  declarations: [
    FlowInfoComponent,
    SingleBlockDialogComponent,
    MultipleBlocksDialogComponent,
    NextDialogComponent,
    PreviousComponent,
    DeleteBlockComponent,
    MissTransferComponent,
    GatherComponent,
    TransferComponent,
    NotificationComponent,
    PlayComponent,
    GoComponent,
    ConditionComponent,
    ConfirmComponent,
    WebhookComponent,
    GatherBranchComponent,
    ConditionBranchComponent,
    WebhookBranchComponent,
    TtsComponent,
    BlockDetailsComponent,
    CommonComponent,
    WorktimeComponent,
    WorktimeCustomComponent,
    MonitorComponent,
    PlaceholderComponent,
    TestCallBeforeDeployToProductionComponent,
    GenieComponent,
    TestCallComponent,
    AddGroupComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    CommsIvrSharedCoreModule,
    SharedCommonModule,
    SharedUiDragScrollModule,
    SharedUiMaterialModule,
    CommsIvrSharedCoreModule
  ],
  exports: [FlowInfoComponent, NotificationComponent],
  providers: [
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER, COMMA]
      }
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ]
})
export class CommsIvrSharedFlowModule {}
