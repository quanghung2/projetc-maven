import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN } from '@b3networks/shared/common';
import { SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';

const routes: Route[] = [
  { path: '', redirectTo: 'genie', pathMatch: 'full' },
  { path: 'genie', loadChildren: () => import('./genie/genie.module').then(m => m.GenieModule) },
  { path: 'server', loadChildren: () => import('./server/server.module').then(m => m.ServerModule) },
  {
    path: 'view-route',
    loadChildren: () => import('./view-route/view-route.module').then(m => m.ViewRouteModule)
  },
  {
    path: 'b3n-cronjob-mgnt',
    loadChildren: () => import('./cronjob-mgnt/cronjob-mgnt.module').then(m => m.CronjobMgntModule)
  },
  // {
  //   path: 'health-check',
  //   loadChildren: () => import('./health-check/health-check.module').then(m => m.HealthCheckModule)
  // },
  {
    path: 'linkages',
    loadChildren: () => import('./linkages/linkages.module').then(m => m.LinkagesModule)
  },
  {
    path: 'ipphone-provision',
    loadChildren: () => import('./ipphone-provision/ipphone-provision.module').then(m => m.IpphoneProvisionModule)
  },
  {
    path: 'cas-config',
    loadChildren: () => import('./cas-config/cas-config.module').then(m => m.CASConfigModule)
  },
  {
    path: 'automation-test',
    loadChildren: () => import('./automation-test/automation-test.module').then(m => m.AutomationTestModule)
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: environment.useHash
    }),
    HttpClientModule,
    BrowserAnimationsModule,
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    SharedUiToastModule.forRoot(),
    SharedModule,
    SharedUiMaterialNativeDateModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
