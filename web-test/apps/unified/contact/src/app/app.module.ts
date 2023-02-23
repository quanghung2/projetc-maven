import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { ROUTE_LINK, SharedModule } from './shared';

const routes: Routes = [
  {
    path: ROUTE_LINK.company,
    loadChildren: () => import('./company/company.module').then(m => m.CompanyModule)
  },
  {
    path: ROUTE_LINK.personal,
    loadChildren: () => import('./personal/personal.module').then(m => m.PersonalModule)
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  }
];

@NgModule({
  declarations: [AppComponent, AccessDeniedComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      enableTracing: false,
      preloadingStrategy: PreloadAllModules,
      useHash: true
    }),
    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    SharedUiToastModule.forRoot(),
    HeaderModule,
    SharedModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
