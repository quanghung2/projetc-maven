import { GoogleLoginProvider, SocialAuthServiceConfig, SocialLoginModule } from '@abacritt/angularx-social-login';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedChatWidgetModule } from '@b3networks/chat/shared/chat-widget';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { QuillModule } from 'ngx-quill';
import { UiScrollModule } from 'ngx-ui-scroll';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AgentProfileComponent } from './chatbox/agent-profile/agent-profile.component';
import { ChatboxContentComponent } from './chatbox/chatbox-content/chatbox-content.component';
import { ChatBoxComponent } from './chatbox/chatbox.component';
import { FormInformationComponent } from './chatbox/form-information/form-information.component';
import { AuthWidgetInterceptor } from './service/auth-widget.interceptor';

const routes: Route[] = [
  { path: ':encUrl', component: ChatBoxComponent },
  { path: '**', component: ChatBoxComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    ChatBoxComponent,
    ChatboxContentComponent,
    FormInformationComponent,
    AgentProfileComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes),

    environment.production ? [] : AkitaNgDevtools.forRoot(),

    SharedCommonModule,
    ChatSharedCoreModule,
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
            provider: new GoogleLoginProvider(environment.clientIdGoogle)
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
