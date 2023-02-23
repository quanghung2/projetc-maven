import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { FlowLogComponent } from './flow/flow-log.component';
import { LogDetailComponent } from './flow/log-detail/log-detail.component';
import { LogTableComponent } from './flow/log-table/log-table.component';
import { LogComponent } from './log.component';
import { OpenApiReqsLogComponent } from './open-api-reqs/open-api-reqs-log.component';
import { ViewBodyDialogComponent } from './view-body-dialog/view-body-dialog.component';
import { WebhooksLogComponent } from './webhooks/webhooks-log.component';

const routes: Routes = [
  { path: '', component: LogComponent },
  { path: ':flowUuid/:version/:id', component: LogComponent }
];

@NgModule({
  declarations: [
    LogComponent,
    FlowLogComponent,
    LogTableComponent,
    LogDetailComponent,
    ViewBodyDialogComponent,
    WebhooksLogComponent,
    OpenApiReqsLogComponent
  ],
  imports: [CommonModule, RouterModule.forChild(routes), SharedCommonModule, SharedUiMaterialModule]
})
export class LogModule {}
