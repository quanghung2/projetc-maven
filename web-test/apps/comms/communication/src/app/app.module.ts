import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN } from '@b3networks/shared/common';
import { SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { ROUTE_LINK } from './shared/contants';

const routes: Routes = [
  {
    path: ROUTE_LINK.users,
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule)
  },
  {
    path: ROUTE_LINK.calls,
    loadChildren: () => import('./calls/calls.module').then(m => m.CallsModule)
  },
  {
    path: ROUTE_LINK.statistics,
    loadChildren: () => import('./statistics/statistics.module').then(m => m.StatisticsModule)
  },
  {
    path: ROUTE_LINK.call_histories,
    loadChildren: () => import('./call-history/call-history.module').then(m => m.CallHistoryModule)
  },
  {
    path: ROUTE_LINK.sms_histories,
    loadChildren: () => import('./sms-history/sms-history.module').then(m => m.SmsHistoryModule)
  },
  {
    path: ROUTE_LINK.campaign,
    loadChildren: () => import('./campaign/campaign.module').then(m => m.CampaignModule)
  },
  {
    path: ROUTE_LINK.compliance,
    loadChildren: () => import('./compliance/compliance.module').then(m => m.ComplianceModule)
  },
  {
    path: ROUTE_LINK.bulk_filtering,
    loadChildren: () => import('./bulk-filtering/bulk-filtering.module').then(m => m.BulkFilteringModule)
  },
  {
    path: ROUTE_LINK.notes,
    loadChildren: () => import('./notes/notes.module').then(m => m.NotesModule)
  },
  {
    path: ROUTE_LINK.chats,
    loadChildren: () => import('./chats/chats.module').then(m => m.ChatsModule)
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
    SharedUiMaterialNativeDateModule,
    FlexLayoutModule,
    HeaderModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
