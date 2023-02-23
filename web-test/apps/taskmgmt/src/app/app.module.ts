import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { QuillModule } from 'ngx-quill';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { SharedModule } from './shared/shared.module';

const routes: Route[] = [
  { path: 'cases', loadChildren: () => import('./cases/cases.module').then(m => m.CasesModule) },
  {
    path: '',
    redirectTo: 'cases',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [AppComponent, HeaderComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, {
      useHash: environment.useHash,
      preloadingStrategy: PreloadAllModules
    }),

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiToastModule.forRoot(),
    SharedUiMaterialNativeDateModule,
    SharedUiPortalModule,

    QuillModule.forRoot({
      modules: {
        syntax: false,
        toolbar: []
      }
    }),

    SharedModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
    // { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
