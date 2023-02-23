import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { CreateComponent } from './inbound-rule-list/create/create.component';
import { InboundRuleListComponent } from './inbound-rule-list/inbound-rule-list.component';
import { InboundRuleComponent } from './inbound-rule.component';

const routes: Routes = [
  { path: '', component: InboundRuleListComponent }
  // { path: '', component: InboundRuleDetailComponent },
  // { path: 'manage-inbound', component: InboundRuleListComponent }
];

@NgModule({
  declarations: [InboundRuleComponent, InboundRuleListComponent, CreateComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    SharedCommonModule,
    CommsSharedModule,
    SharedUiPortalModule,
    PortalMemberSettingSharedModule
  ],
  providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }]
})
export class InboundRuleModule {}
