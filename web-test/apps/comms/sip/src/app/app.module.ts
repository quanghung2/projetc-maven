import { OverlayModule } from '@angular/cdk/overlay';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthInterceptor } from '@b3networks/shared/auth';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { TagInputModule } from 'ngx-chips';
import { ClipboardModule } from 'ngx-clipboard';
import { AppComponent } from './app.component';
import { appRouting, appRoutingProviders } from './app.routing';
import { CallRecordingCustomStorageComponent } from './call-recording-custom-storage/call-recording-custom-storage.component';
import { CalleridRemarkComponent } from './callerid-remark/callerid-remark.component';
import { CalleridRemarkService } from './callerid-remark/callerid-remark.service';
import { AccountAdvanceModalComponent } from './configure/account-advance-modal/account-advance-modal.component';
import { AccountInfoComponent } from './configure/account-info/account-info.component';
import { BackupLineComponent } from './configure/backup-line/backup-line.component';
import { CallRecordingComponent } from './configure/call-recording/call-recording.component';
import { ComplianceComponent } from './configure/compliance/compliance.component';
import { ConfigureComponent } from './configure/configure.component';
import { ConfirmUpdateAccountConfigComponent } from './configure/confirm-update-account-config/confirm-update-account-config.component';
import { ConnectedDevicesComponent } from './configure/connected-devices/connected-devices.component';
import { CountryWhiteListComponent } from './configure/country-white-list/country-white-list.component';
import { DialPlanComponent } from './configure/dial-plan/dial-plan.component';
import { HistoryComponent } from './configure/history/history.component';
import { IPWhiteListComponent } from './configure/ip-white-list/ip-white-list.component';
import { PinLoginComponent } from './configure/pin-login/pin-login.component';
import { AddRountingComponent } from './configure/routing-config/add-rounting/add-rounting.component';
import { RoutingConfigComponent } from './configure/routing-config/routing-config.component';
import { SideBarComponent } from './configure/side-bar/side-bar.component';
import { SubscriptionInfoComponent } from './configure/subscription-info/subscription-info.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { HeaderComponent } from './header/header.component';
import { LandingComponent } from './landing/landing.component';
import {
  AppNamePipe,
  ArrayNumberPipe,
  CacheService,
  CapabilitiesDisplayPipe,
  CapitalizeCasePipe,
  ConfirmationComponent,
  CountryPipe,
  DateFormatterPipe,
  EventStreamService,
  ExportService,
  FilterAccountPipe,
  IvrMessageComponent,
  PaginationComponent,
  RangePipe,
  RoutingService,
  S3Service,
  SMComponent,
  SortPipe,
  SplitPipe,
  TruncatePipe,
  TypeRoutingPipe,
  UuidPipe
} from './shared';
import { ForwardToPipe } from './shared/pipe/forward-to.pipe';
import { SipAccountListComponent } from './sip-account-list/sip-account-list.component';
import { SipNumberListComponent } from './sip-number-list/sip-number-list.component';
import { UpdateLabelComponent } from './update-label/update-label.component';
import { IncomingRulePlanComponent } from './configure/incoming-rule-plan/incoming-rule-plan.component';
import { CreatePlanComponent } from './configure/incoming-rule-plan/create-plan/create-plan.component';

@NgModule({
  providers: [
    CacheService,
    EventStreamService,
    ExportService,
    S3Service,
    CalleridRemarkService,
    RoutingService,
    appRoutingProviders,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  declarations: [
    AppComponent,
    HeaderComponent,
    ContactUsComponent,
    SipAccountListComponent,
    SipNumberListComponent,
    CallRecordingCustomStorageComponent,
    AccountAdvanceModalComponent,
    ConfirmUpdateAccountConfigComponent,
    UpdateLabelComponent,
    LandingComponent,
    ErrorPageComponent,
    PaginationComponent,
    IvrMessageComponent,
    ConfirmationComponent,
    SMComponent,
    ConfigureComponent,
    SideBarComponent,
    AccountInfoComponent,
    SubscriptionInfoComponent,
    DialPlanComponent,
    IPWhiteListComponent,
    CountryWhiteListComponent,
    ConnectedDevicesComponent,
    BackupLineComponent,
    CallRecordingComponent,
    ComplianceComponent,
    HistoryComponent,
    CountryPipe,
    UuidPipe,
    RangePipe,
    AppNamePipe,
    ArrayNumberPipe,
    CapabilitiesDisplayPipe,
    SortPipe,
    FilterAccountPipe,
    TruncatePipe,
    SplitPipe,
    DateFormatterPipe,
    CapitalizeCasePipe,
    CalleridRemarkComponent,
    PinLoginComponent,
    RoutingConfigComponent,
    AddRountingComponent,
    TypeRoutingPipe,
    ForwardToPipe,
    IncomingRulePlanComponent,
    CreatePlanComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    appRouting,
    ClipboardModule,
    TagInputModule,
    OverlayModule,
    SharedUiToastModule.forRoot(),
    FlexLayoutModule
  ],
   bootstrap: [AppComponent]
})
export class AppModule {}
