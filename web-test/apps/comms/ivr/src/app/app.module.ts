import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';

const routes: Routes = [
  {
    path: 'workflows',
    loadChildren: () => import('./workflows/workflows.module').then(m => m.WorkflowsModule)
  },
  { path: '', redirectTo: 'workflows', pathMatch: 'full' },
  { path: '**', redirectTo: 'workflows', pathMatch: 'full' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,

    SharedUiMaterialNativeDateModule,

    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      useHash: environment.useHash,
      preloadingStrategy: PreloadAllModules
    }),

    SharedUiLoadingSpinnerModule,
    HeaderModule,

    FlexLayoutModule,
    SharedUiToastModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER, COMMA]
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
