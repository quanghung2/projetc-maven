import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { AssignInboundRuleComponent } from './inbound-rule-detail/assign-inbound-rule/assign-inbound-rule.component';
import { CallerIdPlanComponent } from './inbound-rule-detail/caller-id-plan/caller-id-plan.component';
import { InboundRuleDetailComponent } from './inbound-rule-detail/inbound-rule-detail.component';
import { StoreCallerIdPlanComponent } from './inbound-rule-detail/store-caller-id-plan/store-caller-id-plan.component';
import { AssignOutboundComponent } from './outbound-rule-detail/assign-outbound-rule/assign-outbound-rule.component';
import { CountriesWhitelistComponent } from './outbound-rule-detail/countries-whitelist/countries-whitelist.component';
import { DefaultDialPlanComponent } from './outbound-rule-detail/default-dial-plan/default-dial-plan.component';
import { DialPlanComponent } from './outbound-rule-detail/dial-plan/dial-plan.component';
import { OrgLinkComponent } from './outbound-rule-detail/org-link/org-link.component';
import { OutboundRuleDetailComponent } from './outbound-rule-detail/outbound-rule-detail.component';
import { StoreCountryWhiteListComponent } from './outbound-rule-detail/store-country-white-list/store-country-white-list.component';
import { StoreDialPlanComponent } from './outbound-rule-detail/store-dial-plan/store-dial-plan.component';
import { StoreOrgLinkComponent } from './outbound-rule-detail/store-org-link/store-org-link.component';
import { CallerIdPipe } from './pipe/caller-id.pipe';
import { SelectExtensionPipe } from './pipe/select-ext.pipe';
import { StatusConsentPipe } from './pipe/status-consent';

@NgModule({
  declarations: [
    SelectExtensionPipe,
    CallerIdPipe,
    StatusConsentPipe,
    OutboundRuleDetailComponent,
    StoreOrgLinkComponent,
    StoreDialPlanComponent,
    StoreCountryWhiteListComponent,
    OrgLinkComponent,
    DialPlanComponent,
    DefaultDialPlanComponent,
    CountriesWhitelistComponent,
    AssignOutboundComponent,
    InboundRuleDetailComponent,
    AssignInboundRuleComponent,
    CallerIdPlanComponent,
    StoreCallerIdPlanComponent
  ],
  imports: [CommonModule, SharedUiMaterialModule, SharedUiPortalModule, SharedCommonModule],
  exports: [SelectExtensionPipe, CallerIdPipe, StatusConsentPipe]
})
export class PortalMemberSettingSharedModule {}
