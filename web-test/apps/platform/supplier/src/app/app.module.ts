import { LayoutModule } from '@angular/cdk/layout';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';

const routes: Route[] = [
  { path: '', redirectTo: 'supplier', pathMatch: 'full' },
  {
    path: 'supplier',
    loadChildren: () => import('./supplier/supplier.module').then(m => m.SupplierModule)
  },
  {
    path: 'plan',
    loadChildren: () => import('./plan/plan.module').then(m => m.PlanModule)
  },
  {
    path: 'routing',
    loadChildren: () => import('./seller-routing/seller-routing.module').then(m => m.SellerRoutingModule)
  },
  {
    path: 'skumapping',
    loadChildren: () => import('./sku-mapping/sku-mapping.module').then(m => m.SkuMappingModule)
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: environment.useHash
    }),

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedUiToastModule.forRoot(),
    SharedUiLoadingSpinnerModule,
    SharedCommonModule,
    FlexLayoutModule,
    LayoutModule,
    SharedUiMaterialModule,
    HeaderModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
