import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AppName } from '@b3networks/fi/flow/shared';
import { SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { FlowAuthInterceptor } from './flow-auth.interceptor';

const routes: Route[] = [
  { path: '', redirectTo: 'flow', pathMatch: 'full' },
  {
    path: 'flow',
    loadChildren: () => import('@b3networks/fi/flow/feature/flow').then(m => m.FiFlowFeatureFlowModule),
    data: { appName: AppName.BUSINESS_ACTION_CREATOR }
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: environment.useHash
    }),
    HttpClientModule,
    BrowserAnimationsModule,
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    SharedUiToastModule.forRoot(),
    SharedUiMaterialNativeDateModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: FlowAuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
