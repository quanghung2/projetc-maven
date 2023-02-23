import { GoogleLoginProvider, SocialAuthServiceConfig, SocialLoginModule } from '@abacritt/angularx-social-login';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, Route, RouterModule } from '@angular/router';
import { ChatSharedChatWidgetModule } from '@b3networks/chat/shared/chat-widget';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { ChatSharedWhatsappModule } from '@b3networks/chat/shared/whatsapp';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { QuillModule } from 'ngx-quill';
import { UiScrollModule } from 'ngx-ui-scroll';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AuthWidgetInterceptor } from './service/auth-widget.interceptor';
import { ChatboxContentComponent } from './tab/chatbox-content/chatbox-content.component';
import { FormInformationComponent } from './tab/form-information/form-information.component';
import { TabComponent } from './tab/tab.component';

const routes: Route[] = [
  {
    path: '',
    component: TabComponent
  }
];

@NgModule({
  declarations: [AppComponent, TabComponent, ChatboxContentComponent, FormInformationComponent],
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
    ChatSharedCoreModule,
    ChatSharedWhatsappModule,
    ChatSharedChatWidgetModule,
    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule,
    UiScrollModule,
    InfiniteScrollModule,
    QuillModule.forRoot({
      modules: {
        syntax: false,
        toolbar: []
      }
    }),
    SocialLoginModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthWidgetInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain },
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: true,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.clientIdGoogle, {
              oneTapEnabled: false
            })
          }
        ],
        onError: err => {
          console.error(err);
        }
      } as SocialAuthServiceConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
