import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { TagInputModule } from 'ngx-chips';
import { ClipboardModule } from 'ngx-clipboard';
import { AppCommonModule } from '../common/common.module';
import { ActionComponent } from './action/action.component';
import { CpaasDefaultRuleComponent } from './cpaas-default-rule/cpaas-default-rule.component';
import { CountriesWhitelistComponent } from './outbound/countries-whitelist/countries-whitelist.component';
import { DialPlansComponent } from './outbound/dial-plans/dial-plans.component';
import { OrgLinkComponent } from './outbound/org-link/org-link.component';
import { PaginationComponent } from './pagination/pagination.component';
import { PortalConfigComponent } from './portal-config.component';
import { StoreCallerIdPlanComponent } from './store/inbound/store-caller-id-plan/store-caller-id-plan.component';
import { StoreCpaasDefaultInboundRuleComponent } from './store/inbound/store-cpaas-default-inbound-rule/store-cpaas-default-inbound-rule.component';
import { ImportDialPlansComponent } from './store/outbound/import-dial-plans/import-dial-plans.component';
import { StoreCountriesWhitelistComponent } from './store/outbound/store-countries-whitelist/store-countries-whitelist.component';
import { StoreCpaasDefaultOutboundRuleComponent } from './store/outbound/store-cpaas-default-outbound-rule/store-cpaas-default-outbound-rule.component';
import { StoreDialPlansComponent } from './store/outbound/store-dial-plans/store-dial-plans.component';
import { StoreOrgLinkComponent } from './store/outbound/store-org-link/store-org-link.component';

@NgModule({
  declarations: [
    PortalConfigComponent,
    ActionComponent,
    PaginationComponent,
    CpaasDefaultRuleComponent,
    StoreCpaasDefaultOutboundRuleComponent,
    StoreDialPlansComponent,
    ImportDialPlansComponent,
    DialPlansComponent,
    CountriesWhitelistComponent,
    StoreCountriesWhitelistComponent,
    OrgLinkComponent,
    StoreOrgLinkComponent,
    StoreCpaasDefaultInboundRuleComponent,
    StoreCallerIdPlanComponent
  ],
  imports: [CommonModule, AppCommonModule, ReactiveFormsModule, TagInputModule, ClipboardModule, SharedUiMaterialModule]
})
export class PortalConfigModule {}
