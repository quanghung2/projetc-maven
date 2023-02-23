import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { LocalStorageUtil } from '@b3networks/shared/common';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AppComponent } from './app.component';
import { DownloadAuthInterceptor } from './download-auth.interceptor';

const routes: Routes = [
  {
    path: '**',
    loadChildren: () => import('./download-file/download-file.module').then(m => m.DownloadFileModule)
  },
  {
    path: '',
    redirectTo: LocalStorageUtil.getItem('download2_file_key'),
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: true
    }),
    HttpClientModule,

    SharedUiLoadingSpinnerModule,
    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DownloadAuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
