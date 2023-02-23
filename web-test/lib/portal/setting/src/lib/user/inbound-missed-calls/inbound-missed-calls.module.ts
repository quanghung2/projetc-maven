import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { FiFlowFeatureBusinessActionModule } from '@b3networks/fi/flow/feature/business-action';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { InboundMissedCallsComponent } from './inbound-missed-calls.component';

const routes = [{ path: '', component: InboundMissedCallsComponent }];

@NgModule({
  declarations: [InboundMissedCallsComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FlexLayoutModule,
    SharedUiMaterialModule,
    FormsModule,
    SharedCommonModule,
    SharedUiPortalModule,
    CommsSharedModule,
    FiFlowFeatureBusinessActionModule
  ]
})
export class InboundMissedCallsModule {}
