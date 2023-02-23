import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { ChatSharedSidebarModule } from '@b3networks/chat/shared/sidebar';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN, INJECT_PRODUCT_BUILD, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { NgxMaskModule } from 'ngx-mask';
import { QuillModule } from 'ngx-quill';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

const routes: Route[] = [
  {
    path: 'conversations',
    loadChildren: () => import('@b3networks/chat/shared/teamchat').then(m => m.ChatSharedTeamchatModule)
  },
  {
    path: 'contacts',
    loadChildren: () => import('@b3networks/chat/shared/contact').then(m => m.ChatSharedContactModule)
  },
  {
    path: 'email',
    loadChildren: () => import('@b3networks/chat/shared/email').then(m => m.ChatSharedEmailModule),
    data: { disableMainSidebar: true }
  },
  {
    path: 'hyperspace',
    loadChildren: () => import('@b3networks/chat/shared/hyperspace').then(m => m.ChatSharedHyperspaceModule)
  },
  {
    path: 'events',
    loadChildren: () => import('@b3networks/chat/shared/events').then(m => m.ChatSharedEventsModule),
    data: { disableMainSidebar: true }
  },
  {
    path: 'landing',
    loadChildren: () => import('@b3networks/chat/shared/landing-page').then(m => m.ChatSharedLandingPageModule),
    data: { disableMainSidebar: true }
  }
];

@NgModule({
  declarations: [AppComponent],
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
    SharedUiToastModule.forRoot(),
    MatDividerModule,
    MatSidenavModule,
    MatButtonModule,
    MatMenuModule,
    SharedUiMaterialNativeDateModule,
    QuillModule.forRoot({
      modules: {
        syntax: false,
        toolbar: []
      }
    }),
    NgxMaskModule.forRoot(),
    FlexLayoutModule,
    ChatSharedCoreModule,
    ChatSharedSidebarModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: INJECT_PRODUCT_BUILD, useValue: environment.production },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
