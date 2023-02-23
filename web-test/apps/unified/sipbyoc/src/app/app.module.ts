import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';

import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { ROUTE_LINK } from './shared';

const routes: Routes = [
  {
    path: ROUTE_LINK.account,
    loadChildren: () => import('./sip-account/sip-account.module').then(m => m.SipAccountModule)
  },
  {
    path: ROUTE_LINK.security,
    loadChildren: () => import('./security/security.module').then(m => m.SecurityModule)
  },
  {
    path: ROUTE_LINK.incoming_setting,
    loadChildren: () => import('./incoming/incoming.module').then(m => m.IncomingModule)
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  }
];

@NgModule({
  declarations: [AppComponent, AccessDeniedComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: environment.useHash,
      preloadingStrategy: PreloadAllModules
    }),

    environment.production ? [] : AkitaNgDevtools.forRoot(),
    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    FlexLayoutModule,
    HeaderModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
