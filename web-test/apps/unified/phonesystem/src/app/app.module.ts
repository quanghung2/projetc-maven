import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { APP_LINK } from '@b3networks/portal/setting';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';

const routes: Route[] = [
  {
    path: APP_LINK.user,
    loadChildren: () => import('@b3networks/portal/setting').then(m => m.PortalMemberSettingSharedUserModule)
  },
  {
    path: APP_LINK.admin,
    loadChildren: () => import('@b3networks/portal/setting').then(m => m.PortalMemberSettingSharedAdminModule)
  }
];

@NgModule({
  declarations: [AppComponent, SidebarComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: true
    }),

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedCommonModule,

    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule,
    SharedUiMaterialNativeDateModule,
    HighlightModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('highlightjs-line-numbers.js'),
        languages: {
          javascript: () => import('highlight.js/lib/languages/javascript')
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
