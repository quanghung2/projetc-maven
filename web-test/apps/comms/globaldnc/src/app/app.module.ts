import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TagInputModule } from 'ngx-chips';
import { AdminToolsComponent } from './admin-tools/admin-tools.component';
import { AppComponent } from './app.component';
import { appRouting, appRoutingProviders } from './app.routing';
import { CheckNumberComponent } from './check-number/check-number.component';
import { ComplianceWindowComponent } from './compliance-window/compliance-window.component';
import { CompliantFlagComponent } from './compliant-flag/compliant-flag.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ErrorPageComponent } from './error-page/error-page.component';
//components
import { HeaderComponent } from './header/header.component';
import { LandingComponent } from './landing/landing.component';
import { AddConsentNumberComponent } from './list-management/add-consent-number/add-consent-number.component';
import { ExportConsentComponent } from './list-management/export-consent/export-consent.component';
import { ListManagementComponent } from './list-management/list-management.component';
import { OrgLinksComponent } from './org-links/org-links.component';
//services
import {
  AppNamePipe,
  ArrayNumberPipe,
  AuthInterceptor,
  CapabilitiesDisplayPipe,
  ConfirmationComponent,
  ConsentStatusPipe,
  CountryPipe,
  DNCStatusPipe,
  FilterAccountPipe,
  ForFilterPipe,
  PaginationComponent,
  RangePipe,
  SMComponent,
  SortPipe,
  SplitPipe,
  SubStringPipe,
  TruncatePipe,
  UuidPipe
} from './shared';
import { AssignAgentComponent } from './user-management/assign-agent/assign-agent.component';
import { UserManagementComponent } from './user-management/user-management.component';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ComplianceWindowComponent,
    ListManagementComponent,
    CheckNumberComponent,
    UserManagementComponent,
    AdminToolsComponent,
    ContactUsComponent,
    LandingComponent,
    ErrorPageComponent,
    AssignAgentComponent,
    AddConsentNumberComponent,
    ExportConsentComponent,
    PaginationComponent,
    ConfirmationComponent,
    SMComponent,
    CountryPipe,
    UuidPipe,
    RangePipe,
    AppNamePipe,
    ConsentStatusPipe,
    DNCStatusPipe,
    ArrayNumberPipe,
    CapabilitiesDisplayPipe,
    SortPipe,
    FilterAccountPipe,
    TruncatePipe,
    SplitPipe,
    ForFilterPipe,
    SubStringPipe,
    OrgLinksComponent,
    CompliantFlagComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    appRouting,
    FormsModule,
    TagInputModule,
    BrowserAnimationsModule
  ],
  providers: [appRoutingProviders, { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule {}
