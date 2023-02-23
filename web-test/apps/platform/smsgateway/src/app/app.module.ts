import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { INJECT_PORTAL_DOMAIN, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AddEditDialogComponent as RouteConfigAddEditDialogComponent } from './route-config/add-edit-dialog/add-edit-dialog.component';
import { RouteConfigComponent } from './route-config/route-config.component';
import { StoreVendorDialogComponent as VendorManagementAddEditDialogComponent } from './vendor-management/store-vendor-dialog/store-vendor-dialog.component';
import { VendorManagementComponent } from './vendor-management/vendor-management.component';

const routes: Routes = [
  { path: 'vendor-management', component: VendorManagementComponent },
  { path: 'route-config', component: RouteConfigComponent },
  { path: '', redirectTo: 'vendor-management', pathMatch: 'full' },
  { path: '**', redirectTo: 'vendor-management', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    RouteConfigAddEditDialogComponent,
    VendorManagementAddEditDialogComponent,
    RouteConfigComponent,
    VendorManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      enableTracing: false,
      preloadingStrategy: PreloadAllModules,
      useHash: true
    }),
    BrowserAnimationsModule,
    SharedUiToastModule.forRoot(),
    SharedUiMaterialModule,
    FlexLayoutModule,
    CommsSharedModule,
    SharedUiPortalModule,
    SharedCommonModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: INJECT_PORTAL_DOMAIN, useValue: environment.portalDomain }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
