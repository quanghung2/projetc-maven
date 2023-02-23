import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule, Routes } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { SidebarComponent } from './sidebar/sidebar.component';

const routes: Routes = [
  {
    path: 'bundles',
    loadChildren: () => import('./service-bundle/service-bundle.module').then(m => m.ServiceBundleModule)
  },
  { path: 'orders', loadChildren: () => import('./order/order.module').then(m => m.OrderModule) },
  {
    path: 'permission',
    loadChildren: () =>
      import('./permission/permission.module').then(m => m.PermissionModule)
  },
  { path: '', redirectTo: 'bundles', pathMatch: 'full' }
];

@NgModule({
  declarations: [AppComponent, SidebarComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: true
    }),

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
