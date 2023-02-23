import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ROUTE_LINK } from './common/constants';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { FilemgntSidebarModule } from './filemgnt-sidebar/filemgnt-sidebar.module';
import { IAM_GROUP_UUIDS } from '@b3networks/api/auth';
import { AccessDeniedModule } from './access-denied/access-denied.module';
import { FILE_EXPLORER } from '@b3networks/shared/common';

const routes: Routes = [
  {
    path: ROUTE_LINK.call_recording,
    loadChildren: () => import('./call-recording-files/call-recording.module').then(m => m.CallRecordingModule)
  },
  // Temporary hide
  // {
  //   path: ROUTE_LINK.voicemail,
  //   loadChildren: () => import('./voicemail/voicemail.module').then(m => m.VoiceMailModule)
  // },
  {
    path: ROUTE_LINK.permission,
    loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.PermissionModule),
    data: { groupUuid: IAM_GROUP_UUIDS.fileExplorer, groupName: FILE_EXPLORER }
  },
  { path: '', redirectTo: ROUTE_LINK.call_recording, pathMatch: 'full' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: true,
      preloadingStrategy: PreloadAllModules
    }),
    SharedUiLoadingSpinnerModule,
    SharedUiMaterialModule,
    SharedUiToastModule.forRoot(),
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    FilemgntSidebarModule,
    AccessDeniedModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
