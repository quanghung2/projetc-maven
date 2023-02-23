import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { LandingPageModule, PortalAuthInterceptor } from '@b3networks/portal/base/shared';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { AppComponent } from './app.component';
import { MainViewComponent } from './main-view/main-view.component';
import { NavigateOrgComponent } from './navigate-org/navigate-org.component';
import { SecurityPolicyComponent } from './security/security.component';
import { SharedModule } from './shared/shared.module';
import { SidebarComponent } from './sidebar/sidebar.component';

const routes: Route[] = [
  // {
  //   path: ':orgUuid/home',
  //   loadChildren: () => import('./landing-page/landing-page.module').then(m => m.LandingPageModule),
  //   data: { title: 'Home' }
  // },
  {
    path: ':orgUuid/account',
    loadChildren: () => import('./account/account.module').then(m => m.AccountModule),
    data: { title: 'Manage Account' }
  },
  {
    path: ':orgUuid/org-chart',
    loadChildren: () => import('./org-chart-page/org-chart-page.module').then(m => m.OrgChartPageModule),
    data: { title: 'Organization Chart' }
  },
  {
    path: ':orgUuid/Reports',
    loadChildren: () => import('@b3networks/portal/org/feature/report').then(m => m.PortalOrgFeatureReportModule),
    data: { title: 'Reports' }
  },
  { path: 'security-check', component: SecurityPolicyComponent, data: { title: 'Security' } },
  {
    path: 'auth',
    loadChildren: () => import('@b3networks/portal/base/feature/auth').then(m => m.PortalBaseFeatureAuthModule),
    data: { showMainSidebar: false, title: 'Authentication' }
  },
  {
    path: ':orgUuid/renewSubscription/:recoverUuid',
    loadChildren: () =>
      import('./recover-subscription/recover-subscription.module').then(m => m.RecoverSubscriptionModule),
    data: { title: 'Recover subscription' }
  }, // for recover subscription only.
  {
    path: ':orgUuid/:view',
    component: MainViewComponent,
    children: [
      {
        path: '**',
        component: MainViewComponent
      }
    ]
  },
  { path: 'access-denied', component: AccessDeniedComponent, data: { showMainSidebar: false } },
  { path: 'error', loadChildren: () => import('./error-page/error-page.module').then(m => m.ErrorPageModule) },
  { path: '**', component: NavigateOrgComponent, data: { showMainSidebar: false } }
];

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    SecurityPolicyComponent,
    MainViewComponent,
    NavigateOrgComponent,
    AccessDeniedComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: true,
      onSameUrlNavigation: 'reload',
      preloadingStrategy: PreloadAllModules
    }),

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedUiToastModule.forRoot(),
    SharedUiLoadingSpinnerModule,
    SharedCommonModule,
    SharedModule,
    SharedUiMaterialModule,

    LandingPageModule,
    SharedUiMaterialNativeDateModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: PortalAuthInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}
