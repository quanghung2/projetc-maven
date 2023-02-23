import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { ForwardCallsFormComponent } from './forward-calls-form/forward-calls-form.component';
import { IncomingRulesComponent } from './incoming-rules.component';
import { RingDelegatesFormComponent } from './ring-delegates-form/ring-delegates-form.component';

const routes: Routes = [{ path: '', component: IncomingRulesComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    SharedCommonModule,
    CommsSharedModule,
    PortalMemberSettingSharedModule,
    SharedUiPortalModule
  ],
  declarations: [IncomingRulesComponent, RingDelegatesFormComponent, ForwardCallsFormComponent]
})
export class IncomingRulesModule {}
