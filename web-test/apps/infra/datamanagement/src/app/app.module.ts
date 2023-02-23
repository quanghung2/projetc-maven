import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';

const routes: Route[] = [
  {
    path: '',
    loadChildren: () => import('./source/source.module').then(m => m.SourceModule)
  },
  {
    path: 'source',
    loadChildren: () => import('./source/source.module').then(m => m.SourceModule)
  },
  {
    path: 'template',
    loadChildren: () => import('./template/template.module').then(m => m.TemplateModule)
  },
  {
    path: 'access',
    loadChildren: () => import('./accessible/accessible.module').then(m => m.AccessibleModule)
  }
];
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: environment.useHash
    }),
    HeaderModule,
    HttpClientModule,

    SharedCommonModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
