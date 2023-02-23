import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { DeployScheduleComponent } from './component/deploy-schedule/deploy-schedule.component';
import { SelectWorkflowDialogComponent } from './component/select-workflow-dialog/select-workflow-dialog.component';
import { StoreWorkflowComponent } from './component/store-workflow/store-workflow.component';
import { VersionHistoryComponent } from './component/version-history/version-history.component';
import { PhoneNumAddedListRequiredDirective } from './directive/phone-num-added-list-required.directive';
import { PhoneNumberDirective } from './directive/phone-num-pattern.directive';
import { CheckRequiredListDirective } from './directive/start-with-list-required.directive';
import { BlockFilterPipe } from './pipe/block-filter.pipe';
import { BranchLabelPipe } from './pipe/branch-label.pipe';
import { HistoryFieldPipe } from './pipe/history-field.pipe';
import { ListFilterPipe } from './pipe/list-filter.pipe';

const PUBLIC_COMPONENTS = [];
const PUBLIC_PIPES = [BlockFilterPipe, BranchLabelPipe, HistoryFieldPipe, ListFilterPipe];
const PUBLIC_DIRECTIVE = [PhoneNumAddedListRequiredDirective, PhoneNumberDirective, CheckRequiredListDirective];

@NgModule({
  imports: [CommonModule, FormsModule, SharedAuthModule, SharedCommonModule, SharedUiMaterialModule],
  exports: [PUBLIC_PIPES, PUBLIC_DIRECTIVE],
  declarations: [
    DeployScheduleComponent,
    VersionHistoryComponent,
    SelectWorkflowDialogComponent,
    StoreWorkflowComponent,
    PUBLIC_PIPES,
    PUBLIC_DIRECTIVE
  ],
  providers: []
})
export class CommsIvrSharedCoreModule {}
