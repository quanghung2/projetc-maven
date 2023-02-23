import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { ComplianceComponent } from './compliance.component';
import { ExtensionComplianceComponent } from './extension-compliance/extension-compliance.component';
import { StoreExtensionComplianceComponent } from './extension-compliance/store-extension-compliance/store-extension-compliance.component';
import { ComplianceDetailComponent } from './sim-compliance/compliance-detail/compliance-detail.component';
import { SimComplianceComponent } from './sim-compliance/sim-compliance.component';
import { SipComplianceComponent } from './sip-compliance/sip-compliance.component';
import { StoreSipComplianceComponent } from './sip-compliance/store-sip-compliance/store-sip-compliance.component';

const routes: Routes = [
  {
    path: '',
    component: ComplianceComponent,
    children: [
      { path: 'msisdn', component: SimComplianceComponent },
      { path: 'extension', component: ExtensionComplianceComponent }
    ]
  }
];

@NgModule({
  declarations: [
    ComplianceComponent,
    ExtensionComplianceComponent,
    SimComplianceComponent,
    SipComplianceComponent,
    ComplianceDetailComponent,
    StoreExtensionComplianceComponent,
    StoreSipComplianceComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedUiMaterialModule,
    CommsSharedModule,
    SharedUiPortalModule
  ]
})
export class ComplianceModule {}
