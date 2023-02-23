import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

const routes: Route[] = [
  {
    path: '',
    loadChildren: () => import('./public-access/public-access.module').then(m => m.PublicAccessModule)
  },
  {
    path: 'release-note',
    loadChildren: () => import('./public-release-note/public-release-note.module').then(m => m.PublicReleaseNoteModule)
  },
  {
    path: 'support-center',
    loadChildren: () =>
      import('./public-support-center/public-support-center.module').then(m => m.PublicSupportCenterModule)
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking', useHash: environment.useHash }),
    HttpClientModule,
    BrowserAnimationsModule,
    SharedUiMaterialModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        horizontalPosition: 'end',
        verticalPosition: 'top'
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
