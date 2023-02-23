import { LayoutModule } from '@angular/cdk/layout';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';

const routes: Routes = [
  { path: 'files', loadChildren: () => import('./file/file.module').then(m => m.FileModule) },
  { path: '', redirectTo: 'files', pathMatch: 'full' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' }),
    SharedUiLoadingSpinnerModule,
    HeaderModule,
    FlexLayoutModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
