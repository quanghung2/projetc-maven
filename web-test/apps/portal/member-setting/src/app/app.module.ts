import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { APP_LINK } from '@b3networks/portal/setting';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { SidebarSettingsModule } from './sidebar-settings/sidebar-settings.module';

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

    SharedUiMaterialNativeDateModule,
    SidebarSettingsModule,
    MatSidenavModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDividerModule,
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
