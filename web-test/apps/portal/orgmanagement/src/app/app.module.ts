import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { PortalMemberSettingSharedAdminModule } from '@b3networks/portal/setting';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { APP_IDS, INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { AppComponent } from './app.component';
import { ROUTE_LINK } from './shared/contants';
import { SidebarModule } from './sidebar/sidebar.module';
import { TopBarComponent } from './top-bar/top-bar.component';

const routes: Route[] = [
  {
    path: ROUTE_LINK.members,
    loadChildren: () => import('@b3networks/portal/org/feature/member').then(m => m.PortalOrgFeatureMemberModule)
  },
  {
    path: ROUTE_LINK.teams,
    loadChildren: () => import('@b3networks/portal/org/feature/team').then(m => m.PortalOrgFeatureTeamModule)
  },
  {
    path: ROUTE_LINK.subscriptions,
    loadChildren: () =>
      import('@b3networks/portal/org/feature/subscription').then(m => m.PortalOrgFeatureSubscriptionModule)
  },
  {
    path: ROUTE_LINK.invoices,
    loadChildren: () => import('@b3networks/portal/org/feature/invoice').then(m => m.PortalOrgFeatureInvoiceModule)
  },
  {
    path: ROUTE_LINK.audit,
    loadChildren: () => import('@b3networks/portal/org/feature/audit').then(m => m.PortalOrgFeatureAuditModule)
  },
  {
    path: ROUTE_LINK.settings,
    loadChildren: () => import('@b3networks/portal/org/feature/settings').then(m => m.PortalOrgFeatureSettingsModule)
  },
  {
    path: ROUTE_LINK.payment,
    loadChildren: () => import('@b3networks/portal/org/feature/payment').then(m => m.PortalOrgFeaturePaymentModule)
  },
  {
    path: ROUTE_LINK.usage_history,
    loadChildren: () => import('@b3networks/portal/org/feature/usage').then(m => m.PortalOrgFeatureUsageModule)
  },
  {
    path: ROUTE_LINK.transactions,
    loadChildren: () =>
      import('@b3networks/portal/org/feature/transaction').then(m => m.PortalOrgFeatureTransactionModule)
  },
  {
    path: ROUTE_LINK.licenses,
    loadChildren: () => import('./license/license.module').then(m => m.LicenseModule)
  },
  {
    path: ROUTE_LINK.call_history,
    loadChildren: () => import('@b3networks/portal/org/feature/history').then(m => m.PortalOrgFeatureHistoryModule),
    data: { appID: APP_IDS.ORG_MANAGEMENTS }
  },
  {
    path: ROUTE_LINK.reports,
    loadChildren: () => import('@b3networks/portal/org/feature/report').then(m => m.PortalOrgFeatureReportModule)
  },
  {
    path: ROUTE_LINK.developer,
    loadChildren: () => import('@b3networks/portal/org/feature/developer').then(m => m.PortalOrgFeatureDeveloperModule)
  },
  {
    path: ROUTE_LINK.compliance,
    loadChildren: () => import('./compliance/compliance.module').then(m => m.ComplianceModule)
  },
  {
    path: ROUTE_LINK.org_link,
    loadChildren: () => import('./org-link/org-link.module').then(m => m.OrgLinkModule)
  },
  {
    path: ROUTE_LINK.hyperspace_management,
    loadChildren: () =>
      import('./hyperspace-management/hyperspace-management.module').then(m => m.HyperspaceManagementModule)
  },
  {
    path: ROUTE_LINK.public_holiday,
    loadChildren: () => import('./public-holiday/public-holiday.module').then(m => m.PublicHolidayModule)
  },
  {
    path: ROUTE_LINK.inbound_call_rule,
    loadChildren: () => import('@b3networks/portal/setting').then(m => m.InboundRuleModule)
  },
  {
    path: ROUTE_LINK.outbound_call_rule,
    loadChildren: () => import('@b3networks/portal/setting').then(m => m.OutboundRuleModule)
  },
  {
    path: '',
    redirectTo: 'members',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [AppComponent, TopBarComponent, AccessDeniedComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: true
    }),

    HttpClientModule,
    BrowserAnimationsModule,

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedCommonModule,
    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule,
    SidebarModule,
    SharedUiMaterialNativeDateModule,
    PortalMemberSettingSharedAdminModule
  ],
  providers: [
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
