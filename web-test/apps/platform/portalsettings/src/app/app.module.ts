import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppCommonModule } from './common/common.module';
import { ErrorComponent } from './components/error/error.component';
import { InvoicePermissionComponent } from './components/invoice-permission/invoice-permission.component';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { PermissionErrorComponent } from './components/permission-error/permission-error.component';
import { DomainSettingsComponent } from './domain-settings/domain-settings.component';
import { UpdateSenderEmailModalComponent } from './domain-settings/modals/update-sender-email-modal/update-sender-email-modal.component';
import { GeneralModule } from './general/general.module';
import { PortalConfigModule } from './portal-config/portal-config.module';
import { TaxComponent } from './tax/tax.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { TagInputModule } from 'ngx-chips';

@NgModule({
  declarations: [
    AppComponent,
    MenuBarComponent,
    ErrorComponent,
    PermissionErrorComponent,
    TaxComponent,
    DomainSettingsComponent,
    UpdateSenderEmailModalComponent,
    InvoicePermissionComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    GeneralModule,
    AppCommonModule,
    AppRoutingModule,
    PortalConfigModule,
    SharedUiToastModule.forRoot(),
    OverlayModule,
    SharedUiMaterialModule,
    TagInputModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
