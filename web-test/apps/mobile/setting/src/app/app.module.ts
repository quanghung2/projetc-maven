import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

const routes: Route[] = [
  { path: 'setting', loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule) },
  { path: '', redirectTo: 'setting', pathMatch: 'full' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      enableTracing: false,
      preloadingStrategy: PreloadAllModules,
      useHash: true
    }),
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
