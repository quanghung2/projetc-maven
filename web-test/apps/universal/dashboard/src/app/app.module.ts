import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { ChartsModule } from 'ng2-charts';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { DashboardAuthInterceptor } from './dashboard-auth.interceptor';
import { HeaderComponent } from './header/header.component';
import { PermissionDeniedComponent } from './permission-denied/permission-denied.component';
import { APP_ROUTING_LINK } from './shared/constants';

const routes: Route[] = [
  {
    path: APP_ROUTING_LINK.dashboard,
    loadChildren: () =>
      import('@b3networks/universal/dashboard/feature/dashboard').then(m => m.UniversalDashboardFeatureDashboardModule)
  },
  {
    path: APP_ROUTING_LINK.dashboard2,
    loadChildren: () =>
      import('@b3networks/universal/dashboard/feature/dashboard-v2').then(
        m => m.UniversalDashboardFeatureDashboardV2Module
      )
  },
  {
    path: APP_ROUTING_LINK.question,
    loadChildren: () =>
      import('@b3networks/universal/dashboard/feature/question').then(m => m.UniversalDashboardFeatureQuestionModule)
  },
  { path: APP_ROUTING_LINK.permissionDenined, component: PermissionDeniedComponent }
];

@NgModule({
  declarations: [AppComponent, HeaderComponent, PermissionDeniedComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,

    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: environment.useHash
      // enableTracing: true
    }),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    SharedUiToastModule.forRoot(),
    ChartsModule
  ],
  providers: [
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain },
    { provide: HTTP_INTERCEPTORS, useClass: DashboardAuthInterceptor, multi: true },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        horizontalPosition: 'end',
        verticalPosition: 'top'
      }
    },
    { provide: 'APP_ID', useValue: environment.appId }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}
