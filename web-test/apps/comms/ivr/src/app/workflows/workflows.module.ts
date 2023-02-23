import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommsIvrSharedCoreModule } from '@b3networks/comms/ivr/shared';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { WorkflowsRoutingModule } from './workflows-routing.module';
import { WorkflowsComponent } from './workflows.component';

@NgModule({
  declarations: [WorkflowsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    WorkflowsRoutingModule,
    CommsIvrSharedCoreModule,
    SharedUiConfirmDialogModule,
    SharedCommonModule,
    SharedAuthModule,
    SharedUiMaterialModule,
    CommsIvrSharedCoreModule
  ],
  providers: []
})
export class WorkflowsModule {}
