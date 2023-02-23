import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { BackupDialogComponent } from './backup-dialog/backup-dialog.component';
import { DownloadCdrReportDialogComponent } from './download-cdr-report-dialog/download-cdr-report-dialog.component';
import { RestoreDialogComponent } from './restore-dialog/restore-dialog.component';

const routes: Route[] = [
  {
    path: 'trunk',
    loadChildren: () => import('./trunk/trunk.module').then(m => m.TrunkModule)
  },
  {
    path: 'setting',
    loadChildren: () => import('./setting/setting.module').then(m => m.SettingModule)
  },
  {
    path: 'routing',
    loadChildren: () => import('./routing/routing.module').then(m => m.RoutingModule)
  },
  {
    path: 'netcap',
    loadChildren: () => import('./netcap/netcap.module').then(m => m.NetcapModule)
  },
  { path: '', redirectTo: 'trunk', pathMatch: 'full' }
];

@NgModule({
  declarations: [AppComponent, BackupDialogComponent, RestoreDialogComponent, DownloadCdrReportDialogComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: environment.useHash
    }),
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    BrowserAnimationsModule,
    HttpClientModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    FlexLayoutModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
