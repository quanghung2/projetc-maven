import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedModule } from '../shared/shared.module';
import { AdminAppAccessComponent } from './admin-app-access/admin-app-access.component';
import { LiabilityComponent } from './liability/liability.component';
import { LinkageComponent } from './linkage/linkage.component';
import { LinkagesComponent } from './linkages.component';
import { StoreAdminAppAccessComponent } from './store/store-admin-app-access/store-admin-app-access.component';
import { StoreLinkageComponent } from './store/store-linkage/store-linkage.component';
import { StoreSupportedCurrenciesComponent } from './store/store-supported-currencies/store-supported-currencies.component';
import { SupportedCurrenciesComponent } from './supported-currencies/supported-currencies.component';
import { RenewalDateConfigComponent } from './renewal-date-config/renewal-date-config.component';

const routes: Route[] = [
  {
    path: '',
    component: LinkagesComponent,
    children: []
  }
];

@NgModule({
  declarations: [
    LinkagesComponent,
    StoreLinkageComponent,
    LinkageComponent,
    SupportedCurrenciesComponent,
    StoreSupportedCurrenciesComponent,
    LiabilityComponent,
    AdminAppAccessComponent,
    StoreAdminAppAccessComponent,
    RenewalDateConfigComponent
  ],
  imports: [RouterModule.forChild(routes), SharedModule, SharedCommonModule]
})
export class LinkagesModule {}
