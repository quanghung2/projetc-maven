import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { OrderModule } from 'ngx-order-pipe';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { PermissionDeniedComponent } from './permission-denied/permission-denied.component';
import { WorkspaceSharedModule } from './workspace-shared/workspace-shared.module';

const routes: Route[] = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'workspace',
    loadChildren: () =>
      import('@b3networks/comms/callcenter/feature/workspace').then(m => m.CommsCallcenterFeatureWorkspaceModule)
  },
  { path: 'queue', loadChildren: () => import('./queue/queue.module').then(m => m.QueueModule) },
  {
    path: 'number-lists',
    loadChildren: () => import('./number-lists/number-lists.module').then(m => m.NumberListsModule)
  },
  {
    path: 'activities-log',
    loadChildren: () => import('./activities-log/activities-log.module').then(m => m.ActivitiesLogModule)
  },
  { path: 'setting', loadChildren: () => import('./setting/setting.module').then(m => m.SettingModule) }
];

@NgModule({
  declarations: [AppComponent, PermissionDeniedComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,

    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: environment.useHash,
      preloadingStrategy: PreloadAllModules
    }),

    OrderModule,
    HeaderModule,
    WorkspaceSharedModule, // inbound txn dialog...

    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
