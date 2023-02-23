import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FiFlowSharedModule } from '../../../../shared/src/lib/fi-flow-shared.module';
import { ActionConfigComponent } from './action-param/action-config/action-config.component';
import { ActionParamComponent } from './action-param/action-param.component';
import { ConnectorConfigComponent } from './connector-config/connector-config.component';
import { InboundMissedCallsComponent } from './inbound-missed-calls/inbound-missed-calls.component';
import { InputParamComponent } from './input-param/input-param.component';
import { QueueManagementDialogComponent } from './queue-management-dialog/queue-management-dialog.component';
import { SharedConfigComponent } from './shared/config.component';
import { SharedParamComponent } from './shared/param.component';
import { TriggerConfigComponent } from './trigger-param/trigger-config/trigger-config.component';
import { TriggerParamComponent } from './trigger-param/trigger-param.component';

@NgModule({
  imports: [CommonModule, FiFlowSharedModule],
  declarations: [
    QueueManagementDialogComponent,
    InboundMissedCallsComponent,
    InputParamComponent,
    ConnectorConfigComponent,
    SharedConfigComponent,
    SharedParamComponent,
    TriggerConfigComponent,
    TriggerParamComponent,
    ActionConfigComponent,
    ActionParamComponent
  ],
  exports: [InboundMissedCallsComponent]
})
export class FiFlowFeatureBusinessActionModule {}
