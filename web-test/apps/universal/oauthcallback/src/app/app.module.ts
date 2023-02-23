import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, Route, RouterModule } from '@angular/router';
import { PortalAuthInterceptor } from '@b3networks/portal/base/shared';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AppComponent } from './app.component';
import { GoogleCallbackComponent } from './google-callback/google-callback.component';
import { MsloginCallbackComponent } from './mslogin-callback/mslogin-callback.component';
import { MsteamsCallbackV2Component } from './msteams-callback-v2/msteams-callback-v2.component';
import { MsteamsCallbackComponent } from './msteams-callback/msteams-callback.component';
import { MyInfoRedirectComponent } from './my-info-redirect/my-info-redirect.component';
import { ZoomCallbackComponent } from './zoom-callback/zoom-callback.component';

const routes: Route[] = [
  {
    path: 'callback',
    component: MyInfoRedirectComponent
  },
  {
    path: 'msteams',
    component: MsteamsCallbackComponent
  },
  {
    path: 'msteamsv2',
    component: MsteamsCallbackV2Component
  },
  {
    path: 'zoom',
    component: ZoomCallbackComponent
  },
  {
    path: 'google',
    component: GoogleCallbackComponent
  },
  {
    path: 'mslogin',
    component: MsloginCallbackComponent
  },
  { path: '', redirectTo: 'callback', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    MyInfoRedirectComponent,
    MsteamsCallbackComponent,
    MsteamsCallbackV2Component,
    ZoomCallbackComponent,
    GoogleCallbackComponent,
    MsloginCallbackComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    RouterModule.forRoot(routes, <ExtraOptions>{}),
    HttpClientModule,

    FlexLayoutModule,
    SharedUiMaterialModule,
    SharedUiLoadingSpinnerModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: PortalAuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
